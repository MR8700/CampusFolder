import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';

export type EmailEventType =
  | 'AUTH_OTP'
  | 'ORDER_PURCHASED'
  | 'RESOURCE_SOLD'
  | 'RESOURCE_PUBLISHED'
  | 'DOCUMENT_DOWNLOADED'
  | 'WALLET_WITHDRAWAL'
  | 'RESOURCE_VALIDATION_PENDING'
  | 'RESOURCE_VALIDATION_REMINDER'
  | 'RESOURCE_APPROVED'
  | 'RESOURCE_REJECTED';

interface SendEmailParams {
  userId?: string;
  to: string;
  subject: string;
  eventType: EmailEventType;
  htmlContent: string;
  textContent?: string;
}

/**
 * Configure Nodemailer Transporter
 * Supports Gmail, Brevo, AWS SES, or standard SMTP
 */
function getTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER || process.env.GMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user, pass },
    });
  }

  if (user && pass && !host) {
    // Standard Gmail service
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });
  }

  // Returns null if credentials not provided in .env (will use robust DB simulation)
  return null;
}

/**
 * Base Academic Email Layout
 */
function buildAcademicHtmlWrapper(title: string, contentHtml: string): string {
  return `
  <!DOCTYPE html>
  <html lang="fr">
  <head>
    <meta charset="utf-8">
    <title>${title}</title>
    <style>
      body { margin:0; padding:0; background-color:#FAF8FF; font-family:'Plus Jakarta Sans', Arial, sans-serif; color:#131B2E; }
      .container { max-width:600px; margin:20px auto; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.06); border:1px solid #E2E7FF; }
      .header { background:linear-gradient(135deg, #0D5C3A 0%, #00422B 100%); padding:28px 24px; text-align:center; color:#ffffff; }
      .header-badge { display:inline-block; background:rgba(255,255,255,0.18); padding:4px 12px; border-radius:20px; font-size:11px; font-weight:bold; letter-spacing:0.05em; text-transform:uppercase; margin-bottom:10px; }
      .header h1 { margin:0; font-size:22px; font-weight:800; letter-spacing:-0.02em; }
      .body { padding:32px 28px; line-height:1.6; font-size:14px; color:#131B2E; }
      .footer { background:#F2F3FF; padding:20px 24px; text-align:center; font-size:11px; color:#707971; border-top:1px solid #E2E7FF; }
      .btn { display:inline-block; background:#0D5C3A; color:#ffffff !important; font-weight:bold; text-decoration:none; padding:12px 24px; border-radius:10px; font-size:13px; margin:16px 0; }
      .highlight-box { background:#F2F3FF; border-left:4px solid #0D5C3A; padding:16px; border-radius:8px; margin:18px 0; }
      .token-badge { font-family:monospace; background:#0D5C3A; color:#ffffff; padding:6px 12px; border-radius:6px; font-weight:bold; font-size:14px; letter-spacing:1px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="header-badge">🇧🇫 Réseau Universitaire • Burkina Faso</div>
        <h1>Campus Folder</h1>
        <p style="margin:4px 0 0; font-size:13px; opacity:0.9;">Plateforme Académique & Partage Pédagogique</p>
      </div>
      <div class="body">
        ${contentHtml}
      </div>
      <div class="footer">
        <p style="margin:0 0 6px;">Campus Folder • UJKZ Ouaga 1 • UTS Bobo • UNA Koudougou • USTA</p>
        <p style="margin:0;">Vous recevez cet e-mail suite à votre activité académique certifiée. Sécurité SSL 256 bits.</p>
      </div>
    </div>
  </body>
  </html>
  `;
}

/**
 * Dispatch Email with User Preference Validation & Multi-Mode Transport
 */
export async function sendAcademicEmail(params: SendEmailParams): Promise<{
  success: boolean;
  messageId?: string;
  mode: 'REAL_SMTP' | 'DB_SIMULATED' | 'OPTED_OUT';
  error?: string;
}> {
  const { userId, to, subject, eventType, htmlContent, textContent } = params;

  try {
    // 1. Verify User Notification Consent ("s'il accepte")
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          notifyEmailAll: true,
          notifyOnPurchase: true,
          notifyOnSale: true,
          notifyOnDownload: true,
          notifyOnPublish: true,
          notifyOnWithdrawal: true,
        },
      });

      if (user) {
        if (!user.notifyEmailAll) {
          console.log(`[EMAIL] Envoi annulé : L'étudiant ${userId} a désactivé toutes les notifications email.`);
          return { success: false, mode: 'OPTED_OUT' };
        }
        if (eventType === 'ORDER_PURCHASED' && !user.notifyOnPurchase) {
          console.log(`[EMAIL] Envoi annulé : L'étudiant a désactivé les avis d'achat.`);
          return { success: false, mode: 'OPTED_OUT' };
        }
        if (eventType === 'RESOURCE_SOLD' && !user.notifyOnSale) {
          console.log(`[EMAIL] Envoi annulé : L'étudiant a désactivé les avis de vente.`);
          return { success: false, mode: 'OPTED_OUT' };
        }
        if (eventType === 'DOCUMENT_DOWNLOADED' && !user.notifyOnDownload) {
          console.log(`[EMAIL] Envoi annulé : L'étudiant a désactivé les avis de téléchargement.`);
          return { success: false, mode: 'OPTED_OUT' };
        }
        if (eventType === 'RESOURCE_PUBLISHED' && !user.notifyOnPublish) {
          console.log(`[EMAIL] Envoi annulé : L'étudiant a désactivé les avis de publication.`);
          return { success: false, mode: 'OPTED_OUT' };
        }
        if (eventType === 'WALLET_WITHDRAWAL' && !user.notifyOnWithdrawal) {
          console.log(`[EMAIL] Envoi annulé : L'étudiant a désactivé les avis de retrait.`);
          return { success: false, mode: 'OPTED_OUT' };
        }
      }
    }

    const fullHtml = buildAcademicHtmlWrapper(subject, htmlContent);
    const transporter = getTransporter();

    // 2. Real SMTP Dispatch if configured
    if (transporter) {
      const from = process.env.SMTP_FROM || `"Campus Folder" <notifications@campusfolder.bf>`;
      const info = await transporter.sendMail({
        from,
        to,
        subject,
        text: textContent || subject,
        html: fullHtml,
      });

      // Audit log in database
      await prisma.emailNotification.create({
        data: {
          userId,
          recipient: to,
          subject,
          eventType,
          contentHtml: fullHtml,
          status: 'SENT',
          provider: 'SMTP',
          messageId: info.messageId,
        },
      });

      console.log(`[EMAIL REAL_SMTP] ✅ Envoyé avec succès à ${to} [MsgId: ${info.messageId}]`);
      return { success: true, messageId: info.messageId, mode: 'REAL_SMTP' };
    }

    // 3. Fallback: Ultra-realistic Database Audit & Log Engine
    const notification = await prisma.emailNotification.create({
      data: {
        userId,
        recipient: to,
        subject,
        eventType,
        contentHtml: fullHtml,
        status: 'SIMULATED',
        provider: 'LOCAL_ENGINE',
        messageId: `SIM-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      },
    });

    console.log(`\n======================================================`);
    console.log(`[CAMPUS FOLDER - EMAIL NOTIFICATION DISPATCHED]`);
    console.log(`Destinataire : ${to}`);
    console.log(`Événement    : ${eventType}`);
    console.log(`Objet        : ${subject}`);
    console.log(`Status       : SIMULATED (Enregistré en Base de Données)`);
    console.log(`ID Log       : ${notification.id}`);
    console.log(`======================================================\n`);

    return { success: true, messageId: notification.messageId || notification.id, mode: 'DB_SIMULATED' };
  } catch (error: any) {
    console.error('[EMAIL ERROR] Échec de transmission :', error);

    // Record error in audit log
    await prisma.emailNotification.create({
      data: {
        userId,
        recipient: to,
        subject,
        eventType,
        contentHtml: htmlContent,
        status: 'FAILED',
        error: error.message || 'Unknown error',
      },
    }).catch(() => {});

    return { success: false, mode: 'DB_SIMULATED', error: error.message };
  }
}

// ----------------------------------------------------
// EVENT-SPECIFIC NOTIFICATION HELPERS
// ----------------------------------------------------

/**
 * 1. Email OTP d'inscription / vérification
 */
export async function sendOtpEmail(to: string, studentName: string, otpCode: string, userId?: string) {
  const subject = `🔐 Votre code de vérification Campus Folder : ${otpCode}`;
  const html = `
    <h2 style="color:#0D5C3A; margin-top:0;">Bienvenue sur Campus Folder, ${studentName} !</h2>
    <p>Vous venez de créer votre compte étudiant officiel avec votre Identifiant National Étudiant (INE).</p>
    <p>Pour confirmer votre adresse email et activer votre portefeuille étudiant, veuillez saisir le code de sécurité suivant :</p>
    <div style="text-align:center; margin:24px 0;">
      <span style="font-family:monospace; font-size:32px; font-weight:800; letter-spacing:6px; color:#0D5C3A; background:#E2E7FF; padding:12px 24px; border-radius:12px; display:inline-block; border:2px dashed #0D5C3A;">
        ${otpCode}
      </span>
    </div>
    <p style="font-size:12px; color:#707971; text-align:center;">Ce code expire dans <strong>10 minutes</strong>. Ne le communiquez à personne.</p>
  `;
  return sendAcademicEmail({ userId, to, subject, eventType: 'AUTH_OTP', htmlContent: html });
}

/**
 * 2. Email confirmation d'achat de document
 */
export async function sendPurchaseConfirmationEmail(params: {
  userId: string;
  to: string;
  studentName: string;
  resourceTitle: string;
  amount: number;
  orderNumber: string;
  downloadToken: string;
}) {
  const { userId, to, studentName, resourceTitle, amount, orderNumber, downloadToken } = params;
  const subject = `📚 Reçu d'achat et déblocage : "${resourceTitle}"`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3005';
  const readerUrl = `${appUrl}/lecteur/${downloadToken}`;

  const html = `
    <h2 style="color:#0D5C3A; margin-top:0;">Paiement confirmé avec succès !</h2>
    <p>Bonjour <strong>${studentName}</strong>,</p>
    <p>Votre achat a été validé. Votre ressource pédagogique est désormais disponible à vie dans votre bibliothèque hors-ligne sécurisée.</p>
    
    <div class="highlight-box">
      <p style="margin:0 0 6px;"><strong>Détails de la commande :</strong></p>
      <p style="margin:2px 0;">• Document : <strong>${resourceTitle}</strong></p>
      <p style="margin:2px 0;">• Montant payé : <strong>${amount.toLocaleString('fr-FR')} FCFA</strong></p>
      <p style="margin:2px 0;">• N° de commande : <code>${orderNumber}</code></p>
      <p style="margin:2px 0;">• Jeton de sécurité : <span class="token-badge">${downloadToken}</span></p>
    </div>

    <div style="text-align:center; margin:24px 0;">
      <a href="${readerUrl}" class="btn">Ouvrir le lecteur hors-ligne certifié</a>
    </div>

    <p style="font-size:12px; color:#707971;">
      Ce document intègre un filigrane personnalisé certifiant votre licence étudiante. Mode lecture sans data activé.
    </p>
  `;
  return sendAcademicEmail({ userId, to, subject, eventType: 'ORDER_PURCHASED', htmlContent: html });
}

/**
 * 3. Email de vente & crédit de portefeuille pour l'auteur
 */
export async function sendSaleNotificationEmail(params: {
  authorId: string;
  to: string;
  authorName: string;
  resourceTitle: string;
  grossAmount: number;
  authorNetShare: number;
  buyerDisplayName: string;
  newBalance: number;
}) {
  const { authorId, to, authorName, resourceTitle, grossAmount, authorNetShare, buyerDisplayName, newBalance } = params;
  const subject = `💰 Nouvelle vente ! Vous avez reçu +${authorNetShare} FCFA sur votre portefeuille`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3005';

  const html = `
    <h2 style="color:#0D5C3A; margin-top:0;">Félicitations ${authorName} !</h2>
    <p>Un étudiant (<strong>${buyerDisplayName}</strong>) vient d'acheter votre document pédagogique :</p>
    <div class="highlight-box">
      <h3 style="margin:0 0 8px; color:#131B2E;">${resourceTitle}</h3>
      <p style="margin:4px 0;">• Prix brut : <strong>${grossAmount} FCFA</strong></p>
      <p style="margin:4px 0;">• Votre gain net (85%) : <strong style="color:#10B981; font-size:16px;">+${authorNetShare.toLocaleString('fr-FR')} FCFA</strong></p>
      <p style="margin:4px 0;">• Commission plateforme (15%) : -${grossAmount - authorNetShare} FCFA</p>
      <hr style="border:0; border-top:1px solid #dae2fd; margin:10px 0;">
      <p style="margin:4px 0; font-weight:bold;">Nouveau solde disponible : <span style="color:#0D5C3A;">${newBalance.toLocaleString('fr-FR')} FCFA</span></p>
    </div>

    <div style="text-align:center; margin:20px 0;">
      <a href="${appUrl}/portefeuille" class="btn">Consulter mon Portefeuille & Retirer mes gains</a>
    </div>
  `;
  return sendAcademicEmail({ userId: authorId, to, subject, eventType: 'RESOURCE_SOLD', htmlContent: html });
}

/**
 * 4. Email de publication d'une ressource
 */
export async function sendPublishConfirmationEmail(params: {
  userId: string;
  to: string;
  authorName: string;
  resourceTitle: string;
  facultyCode: string;
  institutionName: string;
}) {
  const { userId, to, authorName, resourceTitle, facultyCode, institutionName } = params;
  const subject = `📝 Votre ressource "${resourceTitle}" est publiée en amphi`;

  const html = `
    <h2 style="color:#0D5C3A; margin-top:0;">Publication certifiée en ligne !</h2>
    <p>Bonjour <strong>${authorName}</strong>,</p>
    <p>Votre ressource a été vérifiée conformément à la charte pédagogique v2.1 et indexée dans le flux de votre faculté :</p>
    <div class="highlight-box">
      <p style="margin:2px 0;">• Titre : <strong>${resourceTitle}</strong></p>
      <p style="margin:2px 0;">• UFR / Faculté : <strong>${facultyCode}</strong></p>
      <p style="margin:2px 0;">• Campus : <strong>${institutionName}</strong></p>
    </div>
    <p>Chaque fois qu'un camarade achètera ou consultera votre document, votre solde sera automatiquement crédité à 85%.</p>
  `;
  return sendAcademicEmail({ userId, to, subject, eventType: 'RESOURCE_PUBLISHED', htmlContent: html });
}

/**
 * 5. Email d'accusé de téléchargement avec watermark
 */
export async function sendDownloadNoticeEmail(params: {
  userId: string;
  to: string;
  studentName: string;
  resourceTitle: string;
  downloadToken: string;
}) {
  const { userId, to, studentName, resourceTitle, downloadToken } = params;
  const subject = `📥 Accusé de téléchargement : "${resourceTitle}"`;

  const html = `
    <h2 style="color:#0D5C3A; margin-top:0;">Téléchargement sécurisé effectué</h2>
    <p>Bonjour <strong>${studentName}</strong>,</p>
    <p>Vous avez téléchargé ou ouvert le document suivant : <strong>${resourceTitle}</strong>.</p>
    <div class="highlight-box">
      <p style="margin:2px 0;">• Jeton de session : <span class="token-badge">${downloadToken}</span></p>
      <p style="margin:2px 0;">• Filigrane anti-fraude appliqué avec vos coordonnées étudiantes.</p>
    </div>
  `;
  return sendAcademicEmail({ userId, to, subject, eventType: 'DOCUMENT_DOWNLOADED', htmlContent: html });
}

/**
 * 6. Email de confirmation de retrait de gains
 */
export async function sendWithdrawalReceiptEmail(params: {
  userId: string;
  to: string;
  studentName: string;
  amount: number;
  operator: string;
  phone: string;
  withdrawalRef: string;
}) {
  const { userId, to, studentName, amount, operator, phone, withdrawalRef } = params;
  const subject = `💸 Retrait Mobile Money confirmé : ${amount} FCFA vers ${operator}`;

  const html = `
    <h2 style="color:#0D5C3A; margin-top:0;">Virement Mobile Money initié !</h2>
    <p>Bonjour <strong>${studentName}</strong>,</p>
    <p>Votre demande de retrait de gains académiques a été traitée avec succès :</p>
    <div class="highlight-box">
      <p style="margin:2px 0;">• Montant transféré : <strong>${amount.toLocaleString('fr-FR')} FCFA</strong></p>
      <p style="margin:2px 0;">• Opérateur : <strong>${operator}</strong></p>
      <p style="margin:2px 0;">• N° Bénéficiaire : <strong>${phone}</strong></p>
      <p style="margin:2px 0;">• Réf transaction : <code>${withdrawalRef}</code></p>
    </div>
    <p>Les fonds sont immédiatement crédités sur votre compte Mobile Money.</p>
  `;
  return sendAcademicEmail({ userId, to, subject, eventType: 'WALLET_WITHDRAWAL', htmlContent: html });
}

/**
 * 7. Email d'accusé de soumission en cours d'examen (Garantie 24h)
 */
export async function sendSubmissionPendingEmail(params: {
  userId: string;
  to: string;
  authorName: string;
  resourceTitle: string;
  institutionName: string;
}) {
  const { userId, to, authorName, resourceTitle, institutionName } = params;
  const subject = `⏳ Examen en cours (Délai garanti 24h) : "${resourceTitle}"`;

  const html = `
    <h2 style="color:#0D5C3A; margin-top:0;">Document en cours d'examen pédagogique</h2>
    <p>Bonjour <strong>${authorName}</strong>,</p>
    <p>Votre document pédagogique <strong>"${resourceTitle}"</strong> a été transmis avec succès au comité de validation académique de <strong>${institutionName}</strong>.</p>
    <div class="highlight-box">
      <p style="margin:2px 0;">• <strong>Engagement Campus Folder :</strong> Examen et validation sous <strong>24 heures maximum</strong>.</p>
      <p style="margin:2px 0;">• <strong>Contrôle qualité :</strong> Lisibilité du média, conformité au barème anti-spéculation et intégrité académique.</p>
      <p style="margin:2px 0;">• <strong>Option Rappel prioritaire :</strong> En cas de retard au-delà de 24h, vous pouvez activer un rappel direct pour reclasser votre document en priorité absolue chez l'administrateur.</p>
    </div>
    <p>Vous recevrez une notification par e-mail dès que votre publication aura été validée.</p>
  `;
  return sendAcademicEmail({ userId, to, subject, eventType: 'RESOURCE_VALIDATION_PENDING', htmlContent: html });
}

/**
 * 8. Email d'alerte admin lors d'un Rappel Étudiant
 */
export async function sendAdminReminderAlertEmail(params: {
  adminEmail: string;
  studentName: string;
  resourceTitle: string;
  reminderCount: number;
  resourceId: string;
}) {
  const { adminEmail, studentName, resourceTitle, reminderCount, resourceId } = params;
  const subject = `⚠️ [RAPPEL ÉTUDIANT #${reminderCount}] Examen prioritaire requis : "${resourceTitle}"`;

  const html = `
    <h2 style="color:#B91C1C; margin-top:0;">Alerte Modérateur : Rappel Étudiant Déclenché</h2>
    <p>L'étudiant <strong>${studentName}</strong> a relancé la validation de son document pédagogique.</p>
    <div class="highlight-box" style="border-left-color:#B91C1C;">
      <p style="margin:2px 0;">• <strong>Ressource :</strong> ${resourceTitle}</p>
      <p style="margin:2px 0;">• <strong>Nombre de relances :</strong> ${reminderCount}</p>
      <p style="margin:2px 0;">• <strong>Action requise :</strong> Reclassé en priorité haute dans votre tableau de bord administrateur.</p>
      <p style="margin:2px 0;">• <strong>ID Document :</strong> <code>${resourceId}</code></p>
    </div>
    <p><a href="http://localhost:3005/admin" class="btn" style="background:#B91C1C;">Examiner & Valider maintenant</a></p>
  `;
  return sendAcademicEmail({ to: adminEmail, subject, eventType: 'RESOURCE_VALIDATION_REMINDER', htmlContent: html });
}

/**
 * 9. Email de confirmation d'approbation d'un document
 */
export async function sendResourceApprovedEmail(params: {
  userId: string;
  to: string;
  authorName: string;
  resourceTitle: string;
  resourceSlug: string;
}) {
  const { userId, to, authorName, resourceTitle, resourceSlug } = params;
  const subject = `🎉 Document validé et en ligne : "${resourceTitle}"`;

  const html = `
    <h2 style="color:#0D5C3A; margin-top:0;">Félicitations, votre document est en ligne !</h2>
    <p>Bonjour <strong>${authorName}</strong>,</p>
    <p>L'équipe d'administration a examiné et <strong>approuvé</strong> votre publication <strong>"${resourceTitle}"</strong>.</p>
    <p>Votre document est dès maintenant visible par vos pairs d'amphi et disponible au téléchargement.</p>
    <p><a href="http://localhost:3005/ressources/${resourceSlug}" class="btn">Consulter la fiche en ligne</a></p>
  `;
  return sendAcademicEmail({ userId, to, subject, eventType: 'RESOURCE_APPROVED', htmlContent: html });
}

/**
 * 10. Email de rejet de document avec motif
 */
export async function sendResourceRejectedEmail(params: {
  userId: string;
  to: string;
  authorName: string;
  resourceTitle: string;
  rejectionReason: string;
}) {
  const { userId, to, authorName, resourceTitle, rejectionReason } = params;
  const subject = `⚠️ Document non validé : "${resourceTitle}"`;

  const html = `
    <h2 style="color:#B91C1C; margin-top:0;">Examen de votre publication</h2>
    <p>Bonjour <strong>${authorName}</strong>,</p>
    <p>Votre document <strong>"${resourceTitle}"</strong> a été examiné par notre comité de modération mais n'a pas pu être validé pour le motif suivant :</p>
    <div class="highlight-box" style="border-left-color:#B91C1C;">
      <p style="margin:2px 0;"><strong>Motif :</strong> ${rejectionReason}</p>
    </div>
    <p>Vous pouvez corriger et soumettre à nouveau votre document conformément aux règles de la plateforme.</p>
  `;
  return sendAcademicEmail({ userId, to, subject, eventType: 'RESOURCE_REJECTED', htmlContent: html });
}


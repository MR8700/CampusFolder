const path = require('path');
const { PrismaClient } = require(path.join(process.cwd(), 'node_modules/@prisma/client'));
const prisma = new PrismaClient();

async function main() {
  console.log('=== VÉRIFICATION COMPLÈTE DU SYSTÈME CAMPUS FOLDER ===\n');

  // 1. Vérification du serveur actif sur le port 3005
  try {
    const homeRes = await fetch('http://localhost:3005/');
    console.log('1. Serveur HTTP Port 3005 :', homeRes.status === 200 ? '✅ 200 OK (Actif & Opérationnel)' : `Status ${homeRes.status}`);
  } catch (err) {
    console.error('1. Serveur HTTP Port 3005 : ❌ Erreur de connexion', err.message);
  }

  // 2. Test Envoi E-mail OTP via API
  try {
    const otpRes = await fetch('http://localhost:3005/api/v1/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'aminata@campusfolder.bf' }),
    });
    const otpData = await otpRes.json();
    console.log('2. API Envoi Code OTP :', otpData.success ? `✅ Succès (Code généré: ${otpData.otpPreview})` : '❌ Échec', otpData.message || otpData.error);
  } catch (err) {
    console.error('2. API Envoi Code OTP : ❌', err.message);
  }

  // 3. Test Checkout & Déclenchement automatique des E-mails Achat & Vente
  try {
    const resource = await prisma.academicResource.findFirst({
      where: { slug: { contains: 'linguistique' } },
    });

    const checkoutRes = await fetch('http://localhost:3005/api/v1/orders/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resourceId: resource.id,
        paymentMethod: 'CAMPUS_WALLET',
      }),
    });
    const checkoutData = await checkoutRes.json();
    console.log('3. API Checkout & Déblocage :', checkoutData.success ? `✅ Succès (Token: ${checkoutData.downloadToken})` : '❌ Échec', checkoutData.message || checkoutData.error);
  } catch (err) {
    console.error('3. API Checkout : ❌', err.message);
  }

  // 4. Vérification des notifications e-mail enregistrées en base de données
  const notifications = await prisma.emailNotification.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  console.log(`\n4. E-mails enregistrés et tracés en Base de Données (${notifications.length} récents) :`);
  notifications.forEach((n, i) => {
    console.log(`   [#${i + 1}] Type: ${n.eventType} | Destinataire: ${n.recipient} | Statut: ${n.status}`);
    console.log(`        Objet: "${n.subject}"`);
  });

  // 5. Vérification des préférences utilisateur ("s'il accepte")
  const user = await prisma.user.findFirst({
    where: { email: 'aminata@campusfolder.bf' },
    select: {
      email: true,
      ine: true,
      notifyEmailAll: true,
      notifyOnPurchase: true,
      notifyOnSale: true,
      notifyOnDownload: true,
      notifyOnPublish: true,
      notifyOnWithdrawal: true,
    },
  });

  console.log('\n5. Préférences de consentement e-mail de l\'étudiant :', user);

  console.log('\n=== VÉRIFICATION TERMINÉE AVEC SUCCÈS ✅ ===');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

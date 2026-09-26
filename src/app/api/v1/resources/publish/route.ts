import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendSubmissionPendingEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      description,
      institutionId,
      facultyId,
      academicLevelId,
      resourceType,
      moduleName,
      accessMode = 'PAID', // 'FREE' | 'PAID' | 'IN_PERSON'
      priceAmount,
      targetAudience = 'STUDENTS_AND_PUBLIC', // 'STUDENTS' | 'PUBLIC' | 'STUDENTS_AND_PUBLIC'
      youtubeUrl,
      files = [],
      whatsappPhone,
      filiereId,
      whatsappLocation,
      agreementAccepted,
    } = body;

    if (!title || !institutionId || !facultyId || !academicLevelId || !agreementAccepted) {
      return NextResponse.json(
        { error: 'Tous les champs obligatoires et l’acceptation de la charte sont requis.' },
        { status: 400 }
      );
    }

    // Support YouTube video link if provided
    const allFiles = Array.isArray(files) ? [...files] : [];
    if (youtubeUrl && typeof youtubeUrl === 'string' && (youtubeUrl.includes('youtube.com') || youtubeUrl.includes('youtu.be'))) {
      allFiles.push({
        mediaType: 'VIDEO',
        originalFilename: 'Vidéo explicative (YouTube)',
        storagePath: youtubeUrl.trim(),
        mimeType: 'video/youtube',
        sizeBytes: 1024 * 1024,
        labelBadge: 'YOUTUBE HD',
      });
    }

    // 1. Media is strictly required
    if (allFiles.length === 0) {
      return NextResponse.json(
        { error: 'Média pédagogique obligatoire : Vous ne pouvez pas publier une ressource sans joindre au moins un fichier média valide (PDF, audio, vidéo, etc.).' },
        { status: 400 }
      );
    }

    // 2. Pricing Validation: Allow FREE (0 FCFA) or PAID (>= 50 FCFA)
    const isFree = accessMode === 'FREE' || Number(priceAmount) === 0;
    const price = isFree ? 0 : (Number(priceAmount) || 500);

    if (!isFree && price < 50) {
      return NextResponse.json(
        { error: 'Tarification payante minimale : Pour une ressource payante, le prix minimum est de 50 FCFA. Pour une ressource gratuite, sélectionnez le mode Gratuit.' },
        { status: 400 }
      );
    }

    // 3. Check pricing ceiling rule (barème strict) for paid resources
    if (!isFree) {
      const matchingRule = await prisma.pricingCeilingRule.findFirst({
        where: {
          isActive: true,
          OR: [
            { documentType: resourceType },
            { documentType: 'ALL' },
          ],
        },
        orderBy: { documentType: 'asc' },
      });

      if (matchingRule && price > matchingRule.maxPrice) {
        return NextResponse.json(
          {
            error: `Plafond barème dépassé : Le tarif maximum autorisé pour ce type de document est de ${matchingRule.maxPrice} FCFA. Votre saisie (${price} FCFA) dépasse le barème.`,
          },
          { status: 400 }
        );
      }
    }

    // Resolve authenticated user: from cookie session or fallback
    const sessionUserId = req.cookies.get('campus_user_id')?.value;
    let user = null;
    if (sessionUserId) {
      user = await prisma.user.findUnique({
        where: { id: sessionUserId },
        include: { profile: true },
      });
    }

    if (!user) {
      user = await prisma.user.findFirst({
        where: { email: 'aminata@campusfolder.bf' },
        include: { profile: true },
      });
    }

    if (!user) {
      user = await prisma.user.findFirst({
        include: { profile: true },
      });
    }

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non authentifié' }, { status: 401 });
    }

    // Create unique slug
    const baseSlug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const slug = `${baseSlug}-${Date.now().toString(36)}`;

    // Default thumbnail based on faculty/type
    const defaultThumbnail =
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCnleFEQlJt-dnss1cLqHYIsNjS6BplHmwvWLGH2nWX6e7mryDrah1CR5gtCBNyRhxI05vsY4vQG-G2ye9O9_YWFdGOaNHwKs2-aKxbWa18-wLYErNZnxpMfEKOdR4LgaLkCLThibmYxzu90mzUOVdk0G6zBIEOfciI0t27Mdr68ZMMcQXfew8xE2OvcweZuzA7M8YlbAmP8KtODtsxps_UzNnxn9gpL-1ISJksp9xwl8PP77k0tAAS8g';

    const resource = await prisma.academicResource.create({
      data: {
        authorId: user.id,
        institutionId,
        facultyId,
        filiereId: filiereId || null,
        academicLevelId,
        title,
        slug,
        description: description || title,
        resourceType: resourceType || 'EXAM_CORRECTION',
        moduleName: moduleName || 'Général',
        thumbnailUrl: defaultThumbnail,
        isCertified: false,
        badgeQuality: 'En attente d’examen',
        validationStatus: 'PENDING',
        submittedAt: new Date(),
        priorityScore: 1,
        reminderCount: 0,
        targetAudience: ['STUDENTS', 'PUBLIC', 'STUDENTS_AND_PUBLIC'].includes(targetAudience)
          ? targetAudience
          : 'STUDENTS_AND_PUBLIC',
        accessPolicy: {
          create: {
            mode: isFree ? 'FREE' : (accessMode === 'IN_PERSON' ? 'IN_PERSON' : 'PAID'),
            priceAmount: isFree ? 0 : price,
            currency: 'XOF',
            platformFeeRate: 0.15,
            contributorRate: 0.85,
          },
        },
        contactChannel:
          accessMode === 'IN_PERSON' || whatsappPhone
            ? {
                create: {
                  channelType: 'WHATSAPP',
                  phoneNumber: whatsappPhone || user.phoneNumber || '+22676458812',
                  meetingLocation: whatsappLocation || 'Devant l’Amphi A',
                  isEnabled: true,
                },
              }
            : undefined,
        media: {
          create: allFiles.map((f: any, idx: number) => ({
            mediaType: f.mediaType || 'PDF',
            originalFilename: f.originalFilename || 'document.pdf',
            storagePath: f.storagePath || '/uploads/sample_linguistique_examen_2025.pdf',
            mimeType: f.mimeType || 'application/pdf',
            sizeBytes: f.sizeBytes || 1024 * 100,
            durationSeconds: f.durationSeconds || null,
            isMasterFile: idx === 0,
            orderIndex: idx + 1,
            labelBadge: f.labelBadge || (f.mediaType === 'VIDEO' ? 'VIDEO HD' : 'Nouveau'),
          })),
        },
      },
      include: {
        accessPolicy: true,
        contactChannel: true,
        media: true,
      },
    });

    // Record Agreement Acceptance (v2.1)
    const activeAgreementVersion = await prisma.agreementVersion.findFirst({
      where: { version: 'v2.1' },
    });

    if (activeAgreementVersion) {
      await prisma.agreementAcceptance.create({
        data: {
          userId: user.id,
          agreementVersionId: activeAgreementVersion.id,
          resourceId: resource.id,
          ipAddress: '197.239.12.44', // Real local IP simulator
          userAgent: 'CampusFolder Web Mobile PWA',
        },
      });
    }

    // Dispatch 24h SLA pending email ("la plateforme promet une validation après examen qui dure généralement 24h")
    if (user.email) {
      const institution = await prisma.institution.findUnique({ where: { id: institutionId } });

      sendSubmissionPendingEmail({
        userId: user.id,
        to: user.email,
        authorName: user.profile ? `${user.profile.firstName} ${user.profile.lastName}` : 'Contributeur',
        resourceTitle: resource.title,
        institutionName: institution?.shortName || institution?.name || 'Université burkinabè',
      }).catch((err) => console.error('[EMAIL ERROR - PUBLISH NOTICE]', err));
    }

    return NextResponse.json({
      success: true,
      message: 'Ressource enregistrée et indexée avec succès',
      resource,
    });
  } catch (error) {
    console.error('API Error /resources/publish:', error);
    return NextResponse.json({ error: 'Erreur lors de la publication' }, { status: 500 });
  }
}

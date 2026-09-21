const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding Campus Folder Database ---');

  // 1. Countries
  const burkina = await prisma.country.upsert({
    where: { isoCode: 'BF' },
    update: {},
    create: {
      isoCode: 'BF',
      name: 'Burkina Faso',
      phoneCode: '+226',
      flagEmoji: '🇧🇫',
    },
  });

  const mali = await prisma.country.upsert({
    where: { isoCode: 'ML' },
    update: {},
    create: {
      isoCode: 'ML',
      name: 'Mali',
      phoneCode: '+223',
      flagEmoji: '🇲🇱',
    },
  });

  const ci = await prisma.country.upsert({
    where: { isoCode: 'CI' },
    update: {},
    create: {
      isoCode: 'CI',
      name: "Côte d'Ivoire",
      phoneCode: '+225',
      flagEmoji: '🇨🇮',
    },
  });

  const senegal = await prisma.country.upsert({
    where: { isoCode: 'SN' },
    update: {},
    create: {
      isoCode: 'SN',
      name: 'Sénégal',
      phoneCode: '+221',
      flagEmoji: '🇸🇳',
    },
  });

  // 2. Institutions (Universities)
  const ujkz = await prisma.institution.upsert({
    where: { id: 'inst-ujkz' },
    update: {},
    create: {
      id: 'inst-ujkz',
      countryId: burkina.id,
      name: 'Université Joseph KI-ZERBO',
      shortName: 'Univ J. KI-ZERBO 🇧🇫',
      type: 'PUBLIC_UNIVERSITY',
      city: 'Ouagadougou',
      activeStudentsCount: 1420,
      isLive: true,
    },
  });

  const uts = await prisma.institution.upsert({
    where: { id: 'inst-uts' },
    update: {},
    create: {
      id: 'inst-uts',
      countryId: burkina.id,
      name: 'Université Thomas SANKARA',
      shortName: 'Thomas Sankara (UTS)',
      type: 'PUBLIC_UNIVERSITY',
      city: 'Ouagadougou',
      activeStudentsCount: 980,
      isLive: false,
    },
  });

  const una = await prisma.institution.upsert({
    where: { id: 'inst-una' },
    update: {},
    create: {
      id: 'inst-una',
      countryId: burkina.id,
      name: 'Université Nazi BONI',
      shortName: 'Nazi Boni (Bobo)',
      type: 'PUBLIC_UNIVERSITY',
      city: 'Bobo-Dioulasso',
      activeStudentsCount: 650,
      isLive: false,
    },
  });

  const usta = await prisma.institution.upsert({
    where: { id: 'inst-usta' },
    update: {},
    create: {
      id: 'inst-usta',
      countryId: burkina.id,
      name: "Université Saint Thomas d'Aquin",
      shortName: 'USTA (Privée)',
      type: 'PRIVATE_UNIVERSITY',
      city: 'Ouagadougou',
      activeStudentsCount: 420,
      isLive: false,
    },
  });

  // 3. Academic Levels
  const levels = [
    { code: 'L1', label: 'Licence 1', rank: 1 },
    { code: 'L2', label: 'Licence 2', rank: 2 },
    { code: 'L3', label: 'Licence 3', rank: 3 },
    { code: 'M1', label: 'Master 1', rank: 4 },
    { code: 'M2', label: 'Master 2', rank: 5 },
  ];
  const levelMap = {};
  for (const l of levels) {
    const level = await prisma.academicLevel.upsert({
      where: { code: l.code },
      update: {},
      create: l,
    });
    levelMap[l.code] = level.id;
  }

  // 4. Faculties (UFR) for UJKZ
  const facultiesData = [
    { id: 'fac-sjp', name: 'Droit & Sciences Politiques (SJP)', code: 'sjp', iconName: 'gavel', activeDocsCount: 340 },
    { id: 'fac-seg', name: 'Sciences Économiques & Gestion (SEG)', code: 'seg', iconName: 'query_stats', activeDocsCount: 218 },
    { id: 'fac-sea', name: 'Sciences Exactes & Appliquées (SEA)', code: 'sea', iconName: 'calculate', activeDocsCount: 185 },
    { id: 'fac-sds', name: 'Sciences de la Santé (SDS)', code: 'sds', iconName: 'health_and_safety', activeDocsCount: 92 },
    { id: 'fac-lac', name: 'Lettres, Arts & Communication (LAC)', code: 'lac', iconName: 'history_edu', activeDocsCount: 114 },
  ];
  const facultyMap = {};
  for (const f of facultiesData) {
    const fac = await prisma.faculty.upsert({
      where: { id: f.id },
      update: {},
      create: {
        id: f.id,
        institutionId: ujkz.id,
        name: f.name,
        code: f.code,
        iconName: f.iconName,
        activeDocsCount: f.activeDocsCount,
      },
    });
    facultyMap[f.code] = fac.id;
  }

  // 5. Roles
  const roles = [
    { code: 'STUDENT', name: 'Étudiant' },
    { code: 'CONTRIBUTOR', name: 'Contributeur Académique' },
    { code: 'DELEGATE', name: 'Délégué de promotion' },
    { code: 'MODERATOR', name: 'Comité de modération' },
    { code: 'ADMIN', name: 'Administrateur' },
  ];
  for (const r of roles) {
    await prisma.role.upsert({
      where: { code: r.code },
      update: {},
      create: r,
    });
  }

  // 6. Users & Profiles
  // Main logged in student: Aminata Sanogo
  const userAminata = await prisma.user.upsert({
    where: { email: 'aminata@campusfolder.bf' },
    update: { points: 320 },
    create: {
      id: 'user-aminata',
      email: 'aminata@campusfolder.bf',
      phoneNumber: '+22676458812',
      passwordHash: 'argon2_hashed_secret',
      points: 320,
      status: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
      profile: {
        create: {
          firstName: 'Aminata',
          lastName: 'Sanogo',
          displayName: 'Aminata S.',
          avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBNwJTG0v54RwD7UUqMI_atE_M6fpKZQNZV3-pdR9x_yJ06ODzApjk-6EFLKJUr8Q9KCGak2lGdZWB4Mxdvv-sEJraukiI9ijsoREFfNF9rFBlhjUuXVigqGyQeJomUDcO8jGGQhF9ZTWfGdUhOOlTxJndURth7xwR0e32FHp8AtjGNegjwcZ3ltYnu_KXO1kYlDi_pG5_3ZKDu6gENZiQdFMSvSCvF-3sVhLuxbjGukUDHT54rYktNZw',
          bio: 'Étudiante L2 SEG à l’Université Joseph KI-ZERBO',
          institutionId: ujkz.id,
          facultyId: facultyMap['seg'],
          academicLevelId: levelMap['L2'],
        },
      },
      wallet: {
        create: {
          availableBalance: 2400,
          pendingBalance: 0,
          currency: 'XOF',
          cfPayId: 'CF-PAY-AMINATA-01',
        },
      },
    },
  });

  // Top Author: Moussa Ouedraogo (Major 2024 LAC)
  const userMoussa = await prisma.user.upsert({
    where: { email: 'moussa@ujkz.bf' },
    update: {},
    create: {
      id: 'user-moussa',
      email: 'moussa@ujkz.bf',
      phoneNumber: '+22670112233',
      passwordHash: 'argon2_hashed_secret',
      points: 1250,
      status: 'ACTIVE',
      profile: {
        create: {
          firstName: 'Moussa',
          lastName: 'Ouedraogo',
          displayName: 'Moussa O.',
          avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBYIhUHvtel7pkNZrJb3gdQbNdsAIBLE7IcJzbeX-fctDyJ2IDAlarN7q6J6ZDX5IiwDqlKwbybvm3l4xcfcyh1rOnrDNk1zW3s9cfunhS3Uxu2tBAZXuleseJLx60SRjqhRy1L8VcXYdVwS03RREshU1RDj0uo4ez-1j5CLis3NUiYOVl2dtlvAt7o75FHIkWoUQGjCJ5Ko8nC55x0P8VLibZfAEFuZaQn1fuqLb_YmzednW4raG2EnQ',
          bio: 'Major de promo 2024 • UJKZ Ouagadougou • UFR Lettres & Sciences Humaines',
          institutionId: ujkz.id,
          facultyId: facultyMap['lac'],
          academicLevelId: levelMap['L1'],
          isMajorPromo: true,
        },
      },
      wallet: {
        create: {
          availableBalance: 28500,
          pendingBalance: 0,
          currency: 'XOF',
          cfPayId: 'CF-PAY-84920-IBRAHIM',
        },
      },
    },
  });

  // Top Author: Fatimata Diallo (Déléguée L3 Sciences Appliquées)
  const userFatimata = await prisma.user.upsert({
    where: { email: 'fatimata@ujkz.bf' },
    update: {},
    create: {
      id: 'user-fatimata',
      email: 'fatimata@ujkz.bf',
      phoneNumber: '+22675998877',
      passwordHash: 'argon2_hashed_secret',
      points: 840,
      status: 'ACTIVE',
      profile: {
        create: {
          firstName: 'Fatimata',
          lastName: 'Diallo',
          displayName: 'Fatimata D.',
          avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCjC2BBqjMHuxspWXeJT-OC8MDF4Ki7hvlvoYgJIf5xs4Nvw0tdU1C97olgZ01XcBJJ5flXj1i_szjuEwaUX2qaXFWg4CWgieM2LXckus_oXpTmja8tD3l-v74-5VfA86Z0u6hxnoE9HFR6IMW13gTKHnpmj7_LSpSVI7R0uGldiWBnK5GfnAdhFiOWBtU7Ormpv-FtwDSrI0SFUq_giTKDu8vPtVLUeFdRASKhwEITRGqDCR5LDRjUNw',
          bio: 'Déléguée L3 Sciences Appliquées • Passionnée de chimie et synthèse',
          institutionId: ujkz.id,
          facultyId: facultyMap['sea'],
          academicLevelId: levelMap['L3'],
          isDelegate: true,
        },
      },
    },
  });

  // Top Author: Dr. Idriss Traore
  const userIdriss = await prisma.user.upsert({
    where: { email: 'idriss@ujkz.bf' },
    update: {},
    create: {
      id: 'user-idriss',
      email: 'idriss@ujkz.bf',
      phoneNumber: '+22671223344',
      passwordHash: 'argon2_hashed_secret',
      points: 2100,
      status: 'ACTIVE',
      profile: {
        create: {
          firstName: 'Idriss',
          lastName: 'Traoré',
          displayName: 'Dr. Idriss T.',
          avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA8tPvyj3Jx6izJa2Wk6t_EYQGrKrY7-I-oNutdN0b_hWKTp8ckOQ97SpNErj2LsZTq_K7npyaVp_B_SoAfFnKZLqtPPRmsoZEoo4-IVw8TWxpZiHdJbETRXSZlWAnAV_T-HckHsa6yzb_jlDX8ZUI7Hga2ibwWz93xo8Jbp_Y5o-HaI-PCHfszWasB0bKgWFqiyQgSW6-cJHNbyEGDIhTtXGqqIr1e4RNdVq4JNoCz6eHeCNBLkey1Og',
          bio: 'Enseignant-Chercheur & Tuteur d’excellence en Macroéconomie',
          institutionId: ujkz.id,
          facultyId: facultyMap['seg'],
          academicLevelId: levelMap['L2'],
        },
      },
    },
  });

  // Top Author: Ousmane Kaboré (Major 16.4/20 Droit)
  const userOusmane = await prisma.user.upsert({
    where: { email: 'ousmane@ujkz.bf' },
    update: {},
    create: {
      id: 'user-ousmane',
      email: 'ousmane@ujkz.bf',
      phoneNumber: '+22678119900',
      passwordHash: 'argon2_hashed_secret',
      points: 1540,
      status: 'ACTIVE',
      profile: {
        create: {
          firstName: 'Ousmane',
          lastName: 'Kaboré',
          displayName: 'Ousmane K.',
          avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA4SQsNhGCv0gZSRk-rnOclz2da1f7-aeD3HgDcuzYfH1GqKHkaaNS4eHeAHsGSUfKtQY7JySO40oWoox-ev6oLWvEOlwF8oHvlOYaLoes28GhuCwvnlrPg63LmNnR_i5BsisTsglh2Tmzdx89WBZsu6gLplTwh5y-G7bDCIy543RentDXPrB7yniYzpjA-QgKu4kP7ycK5ZIQSofiWGbt9xjfXIgwQ_kfaxvgTLyANbqFBI965gaZykA',
          bio: 'Major Promo Droit 16.4/20 • Synthèses de jurisprudence',
          institutionId: ujkz.id,
          facultyId: facultyMap['sjp'],
          academicLevelId: levelMap['L2'],
          isMajorPromo: true,
        },
      },
    },
  });

  // 7. Seed Agreement (Contrat Contributeur Certifié v2.1)
  const agreement = await prisma.agreement.upsert({
    where: { code: 'CONTRIBUTOR_CHARTER' },
    update: {},
    create: {
      code: 'CONTRIBUTOR_CHARTER',
      title: 'Contrat Contributeur Certifié',
      currentVersion: '2.1',
    },
  });

  const agreementVersion = await prisma.agreementVersion.upsert({
    where: { id: 'agr-ver-2-1' },
    update: {},
    create: {
      id: 'agr-ver-2-1',
      agreementId: agreement.id,
      version: 'v2.1',
      contentMarkdown: `# Contrat Contributeur Certifié v2.1\n\nEn publiant sur Campus Folder, vous garantissez que ces notes, enregistrements et corrigés résultent de votre production ou ont été explicitement autorisés au partage libre. Tout plagiat intégral ou document officiel confidentiel entraîne la suspension immédiate du solde contributeur.\n\n### Répartition financière garantie :\n- 85 % de chaque vente versé directement sur votre portefeuille étudiant.\n- 15 % retenu pour l'hébergement, la sécurité SSL et les frais télécoms opérateurs (Orange Money, Moov Money).\n- Retrait instantané sans frais réseau dès 1 000 FCFA.`,
      contentHash: '7c89f92e811c03bf8921e102837bc901a89f92e811c03bf8921e102837bc901a',
    },
  });

  // 8. Academic Resources (The core real database entries matching the Stitch prototypes)

  // Resource 1: L1 Linguistique Générale (Flagship from Stitch screen 1, 2, 7)
  const res1 = await prisma.academicResource.upsert({
    where: { slug: 'corrige-examen-synthese-linguistique-generale-l1' },
    update: {},
    create: {
      id: 'res-linguistique-l1',
      authorId: userMoussa.id,
      institutionId: ujkz.id,
      facultyId: facultyMap['lac'],
      academicLevelId: levelMap['L1'],
      title: 'Corrigé Examen & Synthèse Linguistique Générale (L1)',
      slug: 'corrige-examen-synthese-linguistique-generale-l1',
      description: 'Correction détaillée pas-à-pas de l’examen session 1, incluant arbre syntaxique complet, méthode de transcription API, et questions types probables pour le rattrapage.',
      resourceType: 'EXAM_CORRECTION',
      moduleName: 'Linguistique Générale',
      academicYear: '2024-2025',
      semester: 'S1',
      urgencyBanner: 'Session Rattrapage & Partiels 2025 • UJKZ Ouaga',
      badgeQuality: 'Vérifié A+',
      isCertified: true,
      isTrending: true,
      pageCount: 14,
      ratingAverage: 4.9,
      ratingCount: 218,
      downloadsCount: 430,
      viewsCount: 2150,
      thumbnailUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCnleFEQlJt-dnss1cLqHYIsNjS6BplHmwvWLGH2nWX6e7mryDrah1CR5gtCBNyRhxI05vsY4vQG-G2ye9O9_YWFdGOaNHwKs2-aKxbWa18-wLYErNZnxpMfEKOdR4LgaLkCLThibmYxzu90mzUOVdk0G6zBIEOfciI0t27Mdr68ZMMcQXfew8xE2OvcweZuzA7M8YlbAmP8KtODtsxps_UzNnxn9gpL-1ISJksp9xwl8PP77k0tAAS8g',
      accessPolicy: {
        create: {
          mode: 'PAID',
          priceAmount: 500,
          currency: 'XOF',
          platformFeeRate: 0.15,
          contributorRate: 0.85,
        },
      },
      contactChannel: {
        create: {
          channelType: 'WHATSAPP',
          phoneNumber: '+22670112233',
          meetingLocation: 'Amphi A aujourd’hui de 16h à 18h',
          meetingSchedule: 'Tous les mardis et jeudis',
          groupMaxMembers: 8,
          templateMessage: 'Bonjour Moussa, je souhaite échanger sur le corrigé de Linguistique L1',
          isEnabled: true,
        },
      },
    },
  });

  // Media files for Resource 1 (The 3 polymorphic bundle files from screen 2)
  await prisma.media.createMany({
    data: [
      {
        resourceId: res1.id,
        mediaType: 'PDF',
        originalFilename: 'Correction_Examen_2025.pdf',
        storagePath: '/uploads/sample_linguistique_examen_2025.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 2516582, // 2.4 Mo
        isMasterFile: true,
        orderIndex: 1,
        labelBadge: '100% lisible',
        description: '14 pages • 2.4 Mo • Annotations en couleur et barème officiel',
      },
      {
        resourceId: res1.id,
        mediaType: 'AUDIO',
        originalFilename: 'Vocal_Points_Clefs_Amphi.mp3',
        storagePath: '/uploads/sample_vocal_amphi_points_clefs.mp3',
        mimeType: 'audio/mpeg',
        sizeBytes: 1153433, // 1.1 Mo
        durationSeconds: 522, // 8 min 42 s
        isMasterFile: false,
        orderIndex: 2,
        labelBadge: 'Aperçu 30s',
        description: 'Explication 8 min 42 s • Moussa en direct sur la morphologie dérivationnelle',
      },
      {
        resourceId: res1.id,
        mediaType: 'IMAGE',
        originalFilename: 'Synthese_Arbre_Syntaxique.jpg',
        storagePath: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCUeNOmRkjhIiWurH8UEA2THc-a8167rdsJQaSzMPhb1qOkmrkgcVtLq-x1EXSQrQoXxsEI3zPah1qxfYSbOC89FM0OSUk3PcXu8HKJ9gtrGL3NcpCaNKwP_dglqVV-jR6jao8gBIsCf6Qp_e2mC_QhoKxnobPFXgX2bXdcDMU1n1ZASAIbjjgVG5srkdIhRXIrRzvrdwMtbRMcLRxGFQjAoGxYyXEnBTQ-Q086Ti_jSNtCfFpZX9FpPA',
        mimeType: 'image/jpeg',
        sizeBytes: 4194304, // 4.0 Mo
        isMasterFile: false,
        orderIndex: 3,
        labelBadge: 'Ultra HD',
        description: 'Ultra HD 3840x2160 • Prise de vue tableau amphi',
      },
    ],
  });

  // Resource 2: L2 Info - Algorithmique Avancée & Arbres (Pack Gratuit 3 Docs)
  const res2 = await prisma.academicResource.upsert({
    where: { slug: 'l2-info-algorithmique-avancee-arbres' },
    update: {},
    create: {
      id: 'res-algo-l2',
      authorId: userFatimata.id,
      institutionId: ujkz.id,
      facultyId: facultyMap['sea'],
      academicLevelId: levelMap['L2'],
      title: 'L2 Info - Algorithmique Avancée & Arbres',
      slug: 'l2-info-algorithmique-avancee-arbres',
      description: 'Pack complet 3 documents : Code C++ des arbres AVL, polycopié PDF de synthèse et photos haute résolution du tableau blanc du TD.',
      resourceType: 'COURSE_NOTES',
      moduleName: 'Algorithmique & Structures de Données',
      academicYear: '2024-2025',
      semester: 'S2',
      badgeQuality: 'Vérifié Commu',
      isCertified: true,
      isTrending: true,
      pageCount: 22,
      ratingAverage: 5.0,
      ratingCount: 88,
      downloadsCount: 1240,
      viewsCount: 3400,
      thumbnailUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC_Ni1CZo_TyS1t4p3KbAVg94_QAvRIyPtedW9YyD53gZOFAyKxuA1bZbH44ixdGZj-eqeBRWyT9nU4JHb-V7S7uuilLiwvAqlsfooUuJwd64WboTOz5OGPZEbn84jQgtwtzW1opZlDqqPPbSuoXxNO6EBruX_Qy3QPIXpIrKMIvi-M-I3PQXcWTsnEsL65RMl5kIrxgETKyXU_8ri1Iucnm7jNv6ay5yFdU5qjUsgHWxyUtGvjmzeH9w',
      accessPolicy: {
        create: {
          mode: 'FREE',
          priceAmount: 0,
          currency: 'XOF',
        },
      },
    },
  });

  // Resource 3: L3 Droit Privé - Droit des Obligations (Mode Présentiel WhatsApp)
  const res3 = await prisma.academicResource.upsert({
    where: { slug: 'l3-droit-prive-droit-des-obligations' },
    update: {},
    create: {
      id: 'res-droit-l3',
      authorId: userOusmane.id,
      institutionId: ujkz.id,
      facultyId: facultyMap['sjp'],
      academicLevelId: levelMap['L3'],
      title: 'L3 Droit Privé - Droit des Obligations',
      slug: 'l3-droit-prive-droit-des-obligations',
      description: 'Séance de travail et de révision des cas pratiques en présentiel à l’Université Joseph KI-ZERBO.',
      resourceType: 'TUTORIAL_SHEET',
      moduleName: 'Droit des Obligations',
      academicYear: '2024-2025',
      semester: 'S1',
      badgeQuality: 'Amphi A',
      isCertified: true,
      isTrending: true,
      pageCount: 8,
      ratingAverage: 4.8,
      ratingCount: 65,
      downloadsCount: 180,
      viewsCount: 920,
      thumbnailUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAtAFa-AkN5Q5Xg-iggHoVLdhCv5sOwqXLsXi4PJYF5JhqcxYw7mC0OqiQp70IsXmeTZLteGh6vb96vljnTWccOtHcnwPGdq6zhvKIY8DDBuJZYHbj2OvBfEsisHD6zZKJtDb6EWaoUaiVLxuY0UMt_cLqL_KEOfF2E8N_hSs69MR_0wQaQCv4Ok4ZI8oHxtI5BN_1_IQNezt9di43UH36KXVsCHq751ZN9NS4hUqKg3WFUnMI6_suNLg',
      accessPolicy: {
        create: {
          mode: 'IN_PERSON',
          priceAmount: 0,
          currency: 'XOF',
        },
      },
      contactChannel: {
        create: {
          channelType: 'WHATSAPP',
          phoneNumber: '+22678119900',
          meetingLocation: 'Amphi A UJKZ',
          meetingSchedule: 'Demain à 16h30',
          groupMaxMembers: 8,
          templateMessage: 'Bonjour Ousmane, je souhaite intégrer le groupe de travail en présentiel de Droit des Obligations',
          isEnabled: true,
        },
      },
    },
  });

  // Resource 4: Chimie Organique II - Synthèse & Réactions Spécifiques (Sujet Rattrapage 2023)
  const res4 = await prisma.academicResource.upsert({
    where: { slug: 'chimie-organique-ii-synthese-reactions-specifiques' },
    update: {},
    create: {
      id: 'res-chimie-l3',
      authorId: userFatimata.id,
      institutionId: ujkz.id,
      facultyId: facultyMap['sea'],
      academicLevelId: levelMap['L3'],
      title: 'Chimie Organique II - Synthèse & Réactions Spécifiques (Sujet Rattrapage 2023)',
      slug: 'chimie-organique-ii-synthese-reactions-specifiques',
      description: 'Sujet complet et corrigé rédigé par la déléguée avec explications des mécanismes réactionnels électrophiles.',
      resourceType: 'EXAM_CORRECTION',
      moduleName: 'Chimie Organique',
      academicYear: '2023-2024',
      semester: 'S2',
      badgeQuality: 'Vérifié Commu',
      isCertified: true,
      isTrending: false,
      pageCount: 6,
      ratingAverage: 4.9,
      ratingCount: 44,
      downloadsCount: 430,
      viewsCount: 1100,
      thumbnailUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC_Ni1CZo_TyS1t4p3KbAVg94_QAvRIyPtedW9YyD53gZOFAyKxuA1bZbH44ixdGZj-eqeBRWyT9nU4JHb-V7S7uuilLiwvAqlsfooUuJwd64WboTOz5OGPZEbn84jQgtwtzW1opZlDqqPPbSuoXxNO6EBruX_Qy3QPIXpIrKMIvi-M-I3PQXcWTsnEsL65RMl5kIrxgETKyXU_8ri1Iucnm7jNv6ay5yFdU5qjUsgHWxyUtGvjmzeH9w',
      accessPolicy: {
        create: {
          mode: 'PAID',
          priceAmount: 300,
          currency: 'XOF',
        },
      },
    },
  });

  // Resource 5: Macroéconomie S4 - Méthode de Résolution Graphique IS-LM (Dr. Idriss T.)
  const res5 = await prisma.academicResource.upsert({
    where: { slug: 'macroeconomie-s4-resolution-graphique-is-lm' },
    update: {},
    create: {
      id: 'res-macro-s4',
      authorId: userIdriss.id,
      institutionId: ujkz.id,
      facultyId: facultyMap['seg'],
      academicLevelId: levelMap['L2'],
      title: 'Macroéconomie S4 - Méthode de Résolution Graphique IS-LM',
      slug: 'macroeconomie-s4-resolution-graphique-is-lm',
      description: 'Enregistrement vidéo d’amphi de 18:40 expliquant pas à pas la dérivation des courbes IS et LM et l’équilibre monétaire.',
      resourceType: 'COURSE_NOTES',
      moduleName: 'Macroéconomie II',
      academicYear: '2024-2025',
      semester: 'S4',
      badgeQuality: 'Vérifié Commu',
      isCertified: true,
      isTrending: false,
      pageCount: 1,
      ratingAverage: 4.9,
      ratingCount: 112,
      downloadsCount: 1800,
      viewsCount: 4200,
      thumbnailUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDmNYBZYgp5Rl7UV2RGWLoWt8EilSH6PmyeOtqq6pAcqcJ1Ht6Z7JxxW7fgccMDqISPA9D6VPm-Rw1g-0d72IVHUwO-AZWqeCLuKDBhHHLevSXN4TdV_3wcj4kpOanLiLVUwBH_9hfTrX0cltc5ns2gvFESMBogfA2OpDCHLQ07DSgDeRruogqdQJwNzUtUJ0TCnqteTPJ0W0PL7sCxIuky6ZsnpAeaWKsBTmIlGf8i9ssvCrKVALLCtQ',
      accessPolicy: {
        create: {
          mode: 'FREE',
          priceAmount: 0,
          currency: 'XOF',
        },
      },
    },
  });

  // Resource 6: Anatomie I - Schémas Légendés & Questions Pièges du Jury
  const res6 = await prisma.academicResource.upsert({
    where: { slug: 'anatomie-i-schemas-legendes-questions-pieges' },
    update: {},
    create: {
      id: 'res-anatomie-l1',
      authorId: userFatimata.id,
      institutionId: ujkz.id,
      facultyId: facultyMap['sds'],
      academicLevelId: levelMap['L1'],
      title: 'Anatomie I - Schémas Légendés & Questions Pièges du Jury',
      slug: 'anatomie-i-schemas-legendes-questions-pieges' ,
      description: 'Fascicule d’anatomie générale avec annotations officielles et QCM corrigés des années antérieures.',
      resourceType: 'OFFICIAL_EXAM',
      moduleName: 'Anatomie Générale',
      academicYear: '2023-2024',
      semester: 'S1',
      badgeQuality: 'OFFICIEL',
      isCertified: true,
      isTrending: false,
      pageCount: 18,
      ratingAverage: 4.7,
      ratingCount: 38,
      downloadsCount: 290,
      viewsCount: 890,
      thumbnailUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAvJv7aFKxzUwhzCv0C5n_1AL4b9dcIHyRGZAqBbWWn1wfPuRGjRBq7kNRjTim7ocS91LoprSM_vArIR7p93a7jVvKuX75-Y_-8p7UVXaqLDViicEtAkHf1eI8Gukc2Xc8QbD9LqYTV2bri9j3-h1wl9s3h0JHmKJIUO47cNYj3lLOIImePvMJleL2Rf2TIOSQp6GrfQuWIH3GkVx1LoMxiPohqN19QJcptTumyhffyKweG_7uRkTOLcw',
      accessPolicy: {
        create: {
          mode: 'PAID',
          priceAmount: 250,
          currency: 'XOF',
        },
      },
    },
  });

  // Resource 7: Spotlight Explorer - Droit Administratif L2 (Major 16.4/20 Ousmane K.)
  const res7 = await prisma.academicResource.upsert({
    where: { slug: 'droit-administratif-l2-fiche-certifiee-major-ujkz' },
    update: {},
    create: {
      id: 'res-droit-admin-l2',
      authorId: userOusmane.id,
      institutionId: ujkz.id,
      facultyId: facultyMap['sjp'],
      academicLevelId: levelMap['L2'],
      title: 'Droit Administratif L2 - Fiche Certifiée Major UJKZ',
      slug: 'droit-administratif-l2-fiche-certifiee-major-ujkz',
      description: 'Synthèse magistrale et 14 cas pratiques corrigés session 2023 par le major de promotion.',
      resourceType: 'SUMMARY_MEMO',
      moduleName: 'Droit Administratif',
      academicYear: '2023-2024',
      semester: 'S2',
      badgeQuality: 'Fiche Certifiée Major',
      isCertified: true,
      isTrending: true,
      pageCount: 16,
      ratingAverage: 5.0,
      ratingCount: 94,
      downloadsCount: 520,
      viewsCount: 1980,
      thumbnailUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAtAFa-AkN5Q5Xg-iggHoVLdhCv5sOwqXLsXi4PJYF5JhqcxYw7mC0OqiQp70IsXmeTZLteGh6vb96vljnTWccOtHcnwPGdq6zhvKIY8DDBuJZYHbj2OvBfEsisHD6zZKJtDb6EWaoUaiVLxuY0UMt_cLqL_KEOfF2E8N_hSs69MR_0wQaQCv4Ok4ZI8oHxtI5BN_1_IQNezt9di43UH36KXVsCHq751ZN9NS4hUqKg3WFUnMI6_suNLg',
      accessPolicy: {
        create: {
          mode: 'PAID',
          priceAmount: 400,
          currency: 'XOF',
        },
      },
    },
  });

  // Resource 8: Macroéconomie 1 : Résumé des 6 chapitres audio (Vocal Amphi + WhatsApp)
  const res8 = await prisma.academicResource.upsert({
    where: { slug: 'macroeconomie-1-resume-6-chapitres-audio' },
    update: {},
    create: {
      id: 'res-macro-audio-l1',
      authorId: userAminata.id,
      institutionId: ujkz.id,
      facultyId: facultyMap['seg'],
      academicLevelId: levelMap['L1'],
      title: 'Macroéconomie 1 : Résumé des 6 chapitres audio',
      slug: 'macroeconomie-1-resume-6-chapitres-audio',
      description: 'Pr. Somé • Enregistré en direct amphi A600 • 42 min d’écoute explicative pour réviser sans écran.',
      resourceType: 'COURSE_NOTES',
      moduleName: 'Macroéconomie I',
      academicYear: '2024-2025',
      semester: 'S1',
      badgeQuality: 'VOCAL AMPHI',
      isCertified: true,
      isTrending: false,
      pageCount: 1,
      ratingAverage: 4.9,
      ratingCount: 84,
      downloadsCount: 310,
      viewsCount: 950,
      thumbnailUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDOY_EGU2gugT48pnKEE2_sKvQdKp4gwfdhtiGZdVWiOCZPc9f5fYdwVewLtfWUhADBSlqs0PV-1ce1poBWdOXW-aKOmdm2mI9SIGN9BPW38jVZDOeK1ssXD7wtMsSGfWQrDBJNBbFwN9j7J5WHYgeF42sFqbPgCdVnjOeRUKy7PnIzWQpzf0WY6cxBQVv_-HPqV6_tC5NNjwPrcXff6-k4f5NolFFB-QdyMsYxLl3C1HPbob2GZJUOew',
      accessPolicy: {
        create: {
          mode: 'PAID',
          priceAmount: 200,
          currency: 'XOF',
        },
      },
    },
  });

  // Resource 9: Algèbre Bilinéaire & Topologie élémentaire (Offert / 0 FCFA)
  const res9 = await prisma.academicResource.upsert({
    where: { slug: 'algebre-bilineaire-topologie-elementaire' },
    update: {},
    create: {
      id: 'res-algebre-l2',
      authorId: userFatimata.id,
      institutionId: una.id,
      facultyId: facultyMap['sea'],
      academicLevelId: levelMap['L2'],
      title: 'Algèbre Bilinéaire & Topologie élémentaire',
      slug: 'algebre-bilineaire-topologie-elementaire',
      description: 'Corrigé rédigé par le Club Scientifique Nazi Boni • Session normale 2022',
      resourceType: 'EXAM_CORRECTION',
      moduleName: 'Algèbre Linéaire',
      academicYear: '2022-2023',
      semester: 'S2',
      badgeQuality: 'SESSION NORMALE 2022',
      isCertified: true,
      isTrending: false,
      pageCount: 12,
      ratingAverage: 5.0,
      ratingCount: 129,
      downloadsCount: 890,
      viewsCount: 2200,
      thumbnailUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuACbNn_j7qcmdiVZujvenuM9122TzmLACT9Ev8ks4U17evYAWJmgIhdNL3ouuO5jkRox48KutwnSaeP9xyEWqVkx_vcK7JOIBsbJjmfDuX7QJBbsrpqTZjQSEg4xpmgYA5HpwZB5EgSTr-55skQGqDLgeGe7PuHMBIFofZrhkgqvIKdJ3ogv5PKZms-VMDI8ClnN3tioWWHQkvmbk2132TVb1iCKfkI6CNu-65kcejYsoW6ykJkBowdxQ',
      accessPolicy: {
        create: {
          mode: 'FREE',
          priceAmount: 0,
          currency: 'XOF',
        },
      },
    },
  });

  // Resource 10: Cardiologie Fondamentale : Cycle Cardiaque (Vidéo MP4 SDS)
  const res10 = await prisma.academicResource.upsert({
    where: { slug: 'cardiologie-fondamentale-cycle-cardiaque' },
    update: {},
    create: {
      id: 'res-cardio-sds',
      authorId: userFatimata.id,
      institutionId: usta.id,
      facultyId: facultyMap['sds'],
      academicLevelId: levelMap['L2'],
      title: 'Cardiologie Fondamentale : Cycle Cardiaque',
      slug: 'cardiologie-fondamentale-cycle-cardiaque',
      description: 'Dr. Traoré B. • Explication simple au tableau blanc avec schéma légendé.',
      resourceType: 'COURSE_NOTES',
      moduleName: 'Cardiologie',
      academicYear: '2024-2025',
      semester: 'S1',
      badgeQuality: 'TUTO VIDÉO (MP4)',
      isCertified: true,
      isTrending: false,
      pageCount: 1,
      ratingAverage: 4.8,
      ratingCount: 61,
      downloadsCount: 420,
      viewsCount: 1300,
      thumbnailUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC3VZsmxj7zNYwRcXrv0A9SLuLau2p2eTyQuGIl-fwDXmrgmlXYS6SsTf9YRdR0SySi_u_lNZfxwI91wJ-oeO1q2_MLAxlQFlNejIWopKISbsAZJ3eG-4MFYWmv0bCQ6AoSmr6-hqrGIiYUPxsf9tYNk7BHw13MPu2-ZLliqq4MCfznXte_si_ourw3I6SZXZQJW-qxjuGn_nUBhWK8yi21NcXabcECoFPEGlTRZeODoSLWTWOgbN0x3A',
      accessPolicy: {
        create: {
          mode: 'PAID',
          priceAmount: 350,
          currency: 'XOF',
        },
      },
    },
  });

  // 9. Real Reviews matching Screen 2
  await prisma.review.createMany({
    data: [
      {
        resourceId: res1.id,
        userId: userAminata.id,
        rating: 5,
        comment: "Le vocal m'a sauvée pour l'analyse des morphèmes ! J'ai validé ma session avec 14.5. Merci Moussa.",
        isVerified: true,
      },
      {
        resourceId: res1.id,
        userId: userFatimata.id,
        rating: 5,
        comment: "Paiement Orange Money direct et téléchargement instantané sans bug de connexion.",
        isVerified: true,
      },
    ],
  });

  // 10. Financial Ledger Entries (Matching Screen 4: Portefeuille & Gains FCFA)
  const moussaWallet = await prisma.wallet.findUnique({
    where: { userId: userMoussa.id },
  });

  if (moussaWallet) {
    // Clear old entries if re-seeding
    await prisma.ledgerEntry.deleteMany({ where: { walletId: moussaWallet.id } });

    await prisma.ledgerEntry.createMany({
      data: [
        {
          walletId: moussaWallet.id,
          entryType: 'SALE_REVENUE',
          direction: 'CREDIT',
          amount: 425,
          balanceAfter: 28500,
          referenceId: 'order-sample-9821',
          description: 'Vente Corrigé Linguistique L1 (Brut 500 FCFA, Frais Ledger 15% -75 FCFA) • Acheteur #9821',
          createdAt: new Date(),
        },
        {
          walletId: moussaWallet.id,
          entryType: 'SALE_REVENUE',
          direction: 'CREDIT',
          amount: 850,
          balanceAfter: 28075,
          referenceId: 'order-sample-7142',
          description: 'Vente Pack Exercices Algo L2 (Brut 1 000 FCFA, Frais Ledger 15% -150 FCFA) • Acheteur #7142',
          createdAt: new Date(Date.now() - 24 * 3600 * 1000),
        },
        {
          walletId: moussaWallet.id,
          entryType: 'WITHDRAWAL',
          direction: 'DEBIT',
          amount: 10000,
          balanceAfter: 27225,
          referenceId: 'with-sample-01',
          description: 'Retrait Orange Money vers +226 70 ** ** 12 • Transfert instantané réussi',
          createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000),
        },
      ],
    });
  }

  // 11. Active Entitlement for Aminata (For the Offline Document Reader Screen 6)
  await prisma.entitlement.upsert({
    where: { downloadToken: 'CF-8921-UJKZ-SSL' },
    update: {},
    create: {
      userId: userAminata.id,
      resourceId: res1.id,
      downloadToken: 'CF-8921-UJKZ-SSL',
      tokenExpiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000), // 1 year
      downloadCount: 3,
    },
  });

  console.log('--- Database successfully seeded with 100% REAL data! ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

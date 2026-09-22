const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

async function main() {
  console.log('--- Seeding CampusFolder Real Production Database ---');

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

  // 2. Universities in Burkina Faso
  const ujkz = await prisma.institution.upsert({
    where: { id: 'inst-ujkz' },
    update: { isLive: true },
    create: {
      id: 'inst-ujkz',
      countryId: burkina.id,
      name: 'Université Joseph KI-ZERBO',
      shortName: 'Univ J. KI-ZERBO 🇧🇫',
      type: 'PUBLIC_UNIVERSITY',
      category: 'UNIVERSITE_PUBLIQUE',
      region: 'Centre',
      city: 'Ouagadougou',
      activeStudentsCount: 1420,
      isLive: true,
    },
  });

  const uts = await prisma.institution.upsert({
    where: { id: 'inst-uts' },
    update: { isLive: true },
    create: {
      id: 'inst-uts',
      countryId: burkina.id,
      name: 'Université Thomas SANKARA',
      shortName: 'Thomas Sankara (UTS)',
      type: 'PUBLIC_UNIVERSITY',
      category: 'UNIVERSITE_PUBLIQUE',
      region: 'Centre',
      city: 'Ouagadougou',
      activeStudentsCount: 980,
      isLive: true,
    },
  });

  const unb = await prisma.institution.upsert({
    where: { id: 'inst-una' },
    update: { isLive: true },
    create: {
      id: 'inst-una',
      countryId: burkina.id,
      name: 'Université Nazi BONI',
      shortName: 'Nazi Boni (UNB Bobo)',
      type: 'PUBLIC_UNIVERSITY',
      category: 'UNIVERSITE_PUBLIQUE',
      region: 'Hauts-Bassins',
      city: 'Bobo-Dioulasso',
      activeStudentsCount: 650,
      isLive: true,
    },
  });

  const unz = await prisma.institution.upsert({
    where: { id: 'inst-unz' },
    update: { isLive: true },
    create: {
      id: 'inst-unz',
      countryId: burkina.id,
      name: 'Université Norbert ZONGO',
      shortName: 'Norbert Zongo (UNZ)',
      type: 'PUBLIC_UNIVERSITY',
      category: 'UNIVERSITE_PUBLIQUE',
      region: 'Centre-Ouest',
      city: 'Koudougou',
      activeStudentsCount: 510,
      isLive: true,
    },
  });

  const usta = await prisma.institution.upsert({
    where: { id: 'inst-usta' },
    update: { isLive: true },
    create: {
      id: 'inst-usta',
      countryId: burkina.id,
      name: "Université Saint Thomas d'Aquin",
      shortName: 'USTA (Saaba)',
      type: 'PRIVATE_UNIVERSITY',
      category: 'UNIVERSITE_PRIVEE',
      region: 'Centre',
      city: 'Ouagadougou',
      activeStudentsCount: 420,
      isLive: true,
    },
  });

  // 3. Academic Levels
  const levels = [
    { code: 'L1', label: 'Licence 1', rank: 1 },
    { code: 'L2', label: 'Licence 2', rank: 2 },
    { code: 'L3', label: 'Licence 3', rank: 3 },
    { code: 'M1', label: 'Master 1', rank: 4 },
    { code: 'M2', label: 'Master 2', rank: 5 },
    { code: 'DOC', label: 'Doctorat', rank: 6 },
    { code: 'BTS', label: 'BTS / DUT', rank: 7 },
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

  // 4. Faculties (UFR)
  const facultiesData = [
    { id: 'fac-sjp', institutionId: ujkz.id, name: 'Droit & Sciences Politiques (SJP)', code: 'sjp', iconName: 'gavel', activeDocsCount: 340 },
    { id: 'fac-seg', institutionId: ujkz.id, name: 'Sciences Économiques & Gestion (SEG)', code: 'seg', iconName: 'query_stats', activeDocsCount: 218 },
    { id: 'fac-sea', institutionId: ujkz.id, name: 'Sciences Exactes & Appliquées (SEA)', code: 'sea', iconName: 'calculate', activeDocsCount: 185 },
    { id: 'fac-sds', institutionId: ujkz.id, name: 'Sciences de la Santé (SDS)', code: 'sds', iconName: 'health_and_safety', activeDocsCount: 92 },
    { id: 'fac-lac', institutionId: ujkz.id, name: 'Lettres, Arts & Communication (LAC)', code: 'lac', iconName: 'history_edu', activeDocsCount: 114 },
    { id: 'fac-uts-seg', institutionId: uts.id, name: 'UFR Sciences Économiques (UTS)', code: 'uts-seg', iconName: 'trending_up', activeDocsCount: 140 },
    { id: 'fac-uts-sjp', institutionId: uts.id, name: 'UFR Sciences Juridiques (UTS)', code: 'uts-sjp', iconName: 'balance', activeDocsCount: 160 },
    { id: 'fac-unb-sea', institutionId: unb.id, name: 'UFR Sciences & Techniques (UNB)', code: 'unb-sea', iconName: 'science', activeDocsCount: 120 },
  ];
  const facultyMap = {};
  for (const f of facultiesData) {
    const fac = await prisma.faculty.upsert({
      where: { id: f.id },
      update: {},
      create: f,
    });
    facultyMap[f.code] = fac.id;
  }

  // 5. Roles
  const roles = [
    { code: 'ADMIN', name: 'Administrateur' },
    { code: 'STUDENT', name: 'Étudiant Burkinabé' },
    { code: 'CONTRIBUTOR', name: 'Contributeur Académique' },
    { code: 'DELEGATE', name: 'Délégué de promotion' },
    { code: 'GENERAL_USER', name: 'Grand Public / Professionnel' },
  ];
  const roleMap = {};
  for (const r of roles) {
    const role = await prisma.role.upsert({
      where: { code: r.code },
      update: {},
      create: r,
    });
    roleMap[r.code] = role.id;
  }

  // 6. Super Admin & Real Production Users
  const defaultPasswordHash = hashPassword('CampusFolder@2026!');

  // Super Admin
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@campusfolder.bf' },
    update: {
      passwordHash: defaultPasswordHash,
      isSuperAdmin: true,
      status: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
    },
    create: {
      id: 'user-admin-bf',
      email: 'admin@campusfolder.bf',
      phoneNumber: '+22670000001',
      passwordHash: defaultPasswordHash,
      isSuperAdmin: true,
      status: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
      points: 5000,
      profile: {
        create: {
          firstName: 'Direction',
          lastName: 'CampusFolder',
          displayName: 'Direction Générale BF',
          avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=CampusFolderAdmin',
          bio: 'Direction Générale & Administration Centrale • CampusFolder Burkina Faso',
          countryCode: 'BF',
          region: 'Centre',
          city: 'Ouagadougou',
          address: 'Avenue Kwamé N’Krumah, Ouagadougou',
        },
      },
      wallet: {
        create: {
          availableBalance: 150000,
          pendingBalance: 0,
          currency: 'XOF',
          cfPayId: 'CF-PAY-ADMIN-01',
        },
      },
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: roleMap['ADMIN'] } },
    update: {},
    create: { userId: adminUser.id, roleId: roleMap['ADMIN'] },
  });

  // Acteur 1 : Aminata Sawadogo (Étudiante Déléguée UJKZ - Burkina Faso)
  const userAminata = await prisma.user.upsert({
    where: { email: 'aminata.sawadogo@campusfolder.bf' },
    update: {
      passwordHash: defaultPasswordHash,
      ine: 'N0145892301',
      status: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
    },
    create: {
      id: 'user-aminata',
      ine: 'N0145892301',
      email: 'aminata.sawadogo@campusfolder.bf',
      phoneNumber: '+22676458812',
      passwordHash: defaultPasswordHash,
      points: 420,
      status: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
      profile: {
        create: {
          firstName: 'Aminata',
          lastName: 'Sawadogo',
          displayName: 'Aminata S. (Déléguée L3)',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
          bio: 'Déléguée Licence 3 SEG • Université Joseph KI-ZERBO (Ouaga 1)',
          countryCode: 'BF',
          region: 'Centre',
          city: 'Ouagadougou',
          filiere: 'Économie Agricole & Développement',
          institutionId: ujkz.id,
          facultyId: facultyMap['seg'],
          academicLevelId: levelMap['L3'],
          isDelegate: true,
        },
      },
      wallet: {
        create: {
          availableBalance: 12500,
          pendingBalance: 0,
          currency: 'XOF',
          cfPayId: 'CF-PAY-AMINATA-01',
        },
      },
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: userAminata.id, roleId: roleMap['STUDENT'] } },
    update: {},
    create: { userId: userAminata.id, roleId: roleMap['STUDENT'] },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: userAminata.id, roleId: roleMap['DELEGATE'] } },
    update: {},
    create: { userId: userAminata.id, roleId: roleMap['DELEGATE'] },
  });

  // Acteur 2 : Ibrahim Ouedraogo (Major & Contributeur UTS - Burkina Faso)
  const userIbrahim = await prisma.user.upsert({
    where: { email: 'ibrahim.ouedraogo@campusfolder.bf' },
    update: {
      passwordHash: defaultPasswordHash,
      ine: 'N0287410293',
      status: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
    },
    create: {
      id: 'user-ibrahim',
      ine: 'N0287410293',
      email: 'ibrahim.ouedraogo@campusfolder.bf',
      phoneNumber: '+22670112233',
      passwordHash: defaultPasswordHash,
      points: 1540,
      status: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
      profile: {
        create: {
          firstName: 'Ibrahim',
          lastName: 'Ouedraogo',
          displayName: 'Ibrahim O. (Major M1)',
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
          bio: 'Major Promo Droit Privé • Université Thomas SANKARA (UTS)',
          countryCode: 'BF',
          region: 'Centre',
          city: 'Ouagadougou',
          filiere: 'Droit des Affaires & Fiscalité',
          institutionId: uts.id,
          facultyId: facultyMap['uts-sjp'],
          academicLevelId: levelMap['M1'],
          isMajorPromo: true,
        },
      },
      wallet: {
        create: {
          availableBalance: 45000,
          pendingBalance: 0,
          currency: 'XOF',
          cfPayId: 'CF-PAY-IBRAHIM-02',
        },
      },
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: userIbrahim.id, roleId: roleMap['STUDENT'] } },
    update: {},
    create: { userId: userIbrahim.id, roleId: roleMap['STUDENT'] },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: userIbrahim.id, roleId: roleMap['CONTRIBUTOR'] } },
    update: {},
    create: { userId: userIbrahim.id, roleId: roleMap['CONTRIBUTOR'] },
  });

  // Acteur 3 : Fatimata Diallo (Étudiante UNB Bobo - Burkina Faso)
  const userFatimata = await prisma.user.upsert({
    where: { email: 'fatimata.diallo@campusfolder.bf' },
    update: {
      passwordHash: defaultPasswordHash,
      ine: 'N0398124567',
      status: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
    },
    create: {
      id: 'user-fatimata',
      ine: 'N0398124567',
      email: 'fatimata.diallo@campusfolder.bf',
      phoneNumber: '+22675998877',
      passwordHash: defaultPasswordHash,
      points: 890,
      status: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
      profile: {
        create: {
          firstName: 'Fatimata',
          lastName: 'Diallo',
          displayName: 'Fatimata D.',
          avatarUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&auto=format&fit=crop&q=80',
          bio: 'Étudiante L3 Sciences & Techniques • Université Nazi BONI (Bobo-Dioulasso)',
          countryCode: 'BF',
          region: 'Hauts-Bassins',
          city: 'Bobo-Dioulasso',
          filiere: 'Chimie & Génie des Procédés',
          institutionId: unb.id,
          facultyId: facultyMap['unb-sea'],
          academicLevelId: levelMap['L3'],
        },
      },
      wallet: {
        create: {
          availableBalance: 8000,
          pendingBalance: 0,
          currency: 'XOF',
          cfPayId: 'CF-PAY-FATIMATA-03',
        },
      },
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: userFatimata.id, roleId: roleMap['STUDENT'] } },
    update: {},
    create: { userId: userFatimata.id, roleId: roleMap['STUDENT'] },
  });

  // Acteur 4 : Dr. Idriss Traoré (Grand Public / Enseignant-Chercheur - Sans INE)
  const userIdriss = await prisma.user.upsert({
    where: { email: 'idriss.traore@campusfolder.bf' },
    update: {
      passwordHash: defaultPasswordHash,
      ine: null,
      status: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
    },
    create: {
      id: 'user-idriss',
      email: 'idriss.traore@campusfolder.bf',
      phoneNumber: '+22671223344',
      passwordHash: defaultPasswordHash,
      points: 3100,
      status: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
      profile: {
        create: {
          firstName: 'Idriss',
          lastName: 'Traoré',
          displayName: 'Dr. Idriss Traoré',
          avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
          bio: 'Enseignant-Chercheur en Économie & Formateur Préparation Concours Nationaux (ENA, Douanes)',
          countryCode: 'BF',
          region: 'Centre',
          city: 'Ouagadougou',
          address: 'Ouaga 2000, Ouagadougou',
        },
      },
      wallet: {
        create: {
          availableBalance: 98000,
          pendingBalance: 0,
          currency: 'XOF',
          cfPayId: 'CF-PAY-IDRISS-04',
        },
      },
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: userIdriss.id, roleId: roleMap['CONTRIBUTOR'] } },
    update: {},
    create: { userId: userIdriss.id, roleId: roleMap['CONTRIBUTOR'] },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: userIdriss.id, roleId: roleMap['GENERAL_USER'] } },
    update: {},
    create: { userId: userIdriss.id, roleId: roleMap['GENERAL_USER'] },
  });

  // 7. Academic Resources & Products (Real Publications with Visibilities)

  // Publication 1 : Corrigé Examen & Synthèse Linguistique Générale L1 (RÉSERVÉ ÉTUDIANTS BF)
  await prisma.academicResource.upsert({
    where: { slug: 'corrige-examen-synthese-linguistique-generale-l1' },
    update: {
      visibility: 'BURKINA_STUDENTS_ONLY',
      validationStatus: 'APPROVED',
    },
    create: {
      id: 'res-linguistique-l1',
      authorId: userIbrahim.id,
      institutionId: ujkz.id,
      facultyId: facultyMap['lac'],
      academicLevelId: levelMap['L1'],
      title: 'Corrigé Examen & Synthèse Linguistique Générale (L1)',
      slug: 'corrige-examen-synthese-linguistique-generale-l1',
      description: 'Correction détaillée pas-à-pas de l’examen session 1, méthode de transcription API, et questions probables pour le rattrapage.',
      resourceType: 'EXAM_CORRECTION',
      moduleName: 'Linguistique Générale',
      academicYear: '2024-2025',
      semester: 'S1',
      urgencyBanner: 'Session Rattrapage & Partiels • UJKZ Ouaga',
      badgeQuality: 'Vérifié A+',
      isCertified: true,
      isTrending: true,
      visibility: 'BURKINA_STUDENTS_ONLY', // Strictement réservé aux étudiants burkinabés
      pageCount: 14,
      ratingAverage: 4.9,
      ratingCount: 218,
      downloadsCount: 430,
      viewsCount: 2150,
      thumbnailUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=500&auto=format&fit=crop&q=80',
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
          templateMessage: 'Bonjour Ibrahim, je souhaite échanger sur le corrigé de Linguistique L1',
          isEnabled: true,
        },
      },
    },
  });

  // Publication 2 : Polycopié Synthèse Droit Constitutionnel & Institutions Politiques L1 (RÉSERVÉ ÉTUDIANTS BF)
  await prisma.academicResource.upsert({
    where: { slug: 'synthese-droit-constitutionnel-l1-ujkz' },
    update: {
      visibility: 'BURKINA_STUDENTS_ONLY',
      validationStatus: 'APPROVED',
    },
    create: {
      id: 'res-droit-const-l1',
      authorId: userIbrahim.id,
      institutionId: ujkz.id,
      facultyId: facultyMap['sjp'],
      academicLevelId: levelMap['L1'],
      title: 'Polycopié Synthèse Droit Constitutionnel & Institutions Politiques (L1)',
      slug: 'synthese-droit-constitutionnel-l1-ujkz',
      description: 'Fiche de révision complète des régimes politiques, histoire constitutionnelle du Burkina Faso et dissertations types corrigées.',
      resourceType: 'COURSE_NOTES',
      moduleName: 'Droit Constitutionnel',
      academicYear: '2024-2025',
      semester: 'S1',
      badgeQuality: 'Vérifié Commu',
      isCertified: true,
      isTrending: true,
      visibility: 'BURKINA_STUDENTS_ONLY',
      pageCount: 22,
      ratingAverage: 4.8,
      ratingCount: 165,
      downloadsCount: 310,
      viewsCount: 1840,
      thumbnailUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=500&auto=format&fit=crop&q=80',
      accessPolicy: {
        create: {
          mode: 'PAID',
          priceAmount: 500,
          currency: 'XOF',
          platformFeeRate: 0.15,
          contributorRate: 0.85,
        },
      },
    },
  });

  // Publication 3 : Fascicule Préparation Concours Directs Fonction Publique 2026 (PUBLIC - OUVERT À TOUS)
  await prisma.academicResource.upsert({
    where: { slug: 'fascicule-concours-fonction-publique-2026-burkina' },
    update: {
      visibility: 'PUBLIC',
      validationStatus: 'APPROVED',
    },
    create: {
      id: 'res-concours-fp-2026',
      authorId: userIdriss.id,
      institutionId: ujkz.id,
      facultyId: facultyMap['seg'],
      academicLevelId: levelMap['L3'],
      title: 'Fascicule Préparation Concours Fonction Publique 2026 : Culture Générale & QCM (ENA, Douanes, Police)',
      slug: 'fascicule-concours-fonction-publique-2026-burkina',
      description: 'Guide stratégique officiel de préparation aux concours directs : 500 QCM corrigés sur les institutions du Burkina, l’actualité sahélienne, et tests psychotechniques.',
      resourceType: 'CONCOURS_TEST',
      moduleName: 'Culture Générale & Concours Directs',
      academicYear: '2025-2026',
      semester: 'Annuel',
      urgencyBanner: 'Concours Directs 2026 • Candidatures Ouvertes',
      badgeQuality: 'Officiel',
      isCertified: true,
      isTrending: true,
      visibility: 'PUBLIC', // Ouvert au grand public et aux étudiants
      pageCount: 65,
      ratingAverage: 5.0,
      ratingCount: 480,
      downloadsCount: 1120,
      viewsCount: 5600,
      thumbnailUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=500&auto=format&fit=crop&q=80',
      accessPolicy: {
        create: {
          mode: 'PAID',
          priceAmount: 1000,
          currency: 'XOF',
          platformFeeRate: 0.15,
          contributorRate: 0.85,
        },
      },
    },
  });

  // Publication 4 : Pack Révision Macroéconomie & Comptabilité Nationale L2 (RÉSERVÉ ÉTUDIANTS BF)
  await prisma.academicResource.upsert({
    where: { slug: 'pack-macroeconomie-comptabilite-nationale-l2-uts' },
    update: {
      visibility: 'BURKINA_STUDENTS_ONLY',
      validationStatus: 'APPROVED',
    },
    create: {
      id: 'res-macro-l2-uts',
      authorId: userAminata.id,
      institutionId: uts.id,
      facultyId: facultyMap['uts-seg'],
      academicLevelId: levelMap['L2'],
      title: 'Pack Révision Macroéconomie & Comptabilité Nationale (L2 UTS)',
      slug: 'pack-macroeconomie-comptabilite-nationale-l2-uts',
      description: 'Modèles IS-LM, équilibres macroéconomiques et exercices corrigés avec barèmes des devoirs surveillés des 3 dernières années.',
      resourceType: 'COURSE_NOTES',
      moduleName: 'Macroéconomie II',
      academicYear: '2024-2025',
      semester: 'S2',
      badgeQuality: 'Vérifié A+',
      isCertified: true,
      isTrending: true,
      visibility: 'BURKINA_STUDENTS_ONLY',
      pageCount: 28,
      ratingAverage: 4.9,
      ratingCount: 142,
      downloadsCount: 390,
      viewsCount: 1720,
      thumbnailUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&auto=format&fit=crop&q=80',
      accessPolicy: {
        create: {
          mode: 'PAID',
          priceAmount: 750,
          currency: 'XOF',
          platformFeeRate: 0.15,
          contributorRate: 0.85,
        },
      },
    },
  });

  // Publication 5 : Méthodologie Complète Rédaction Mémoire & Soutenance (PUBLIC - GRATUIT)
  await prisma.academicResource.upsert({
    where: { slug: 'guide-methodologie-redaction-memoire-master-soutenance' },
    update: {
      visibility: 'PUBLIC',
      validationStatus: 'APPROVED',
    },
    create: {
      id: 'res-guide-memoire-master',
      authorId: userIdriss.id,
      institutionId: ujkz.id,
      facultyId: facultyMap['seg'],
      academicLevelId: levelMap['M2'],
      title: 'Guide Méthodologique : Rédaction de Mémoire de Master & Réussir sa Soutenance',
      slug: 'guide-methodologie-redaction-memoire-master-soutenance',
      description: 'Canevas académique complet pour structurer sa problématique, revue de littérature, analyse empirique et préparation du pitch devant le jury.',
      resourceType: 'SUMMARY_MEMO',
      moduleName: 'Méthodologie de la Recherche',
      academicYear: '2024-2025',
      semester: 'S4',
      badgeQuality: 'Officiel',
      isCertified: true,
      isTrending: true,
      visibility: 'PUBLIC', // Ouvert à tous gratuitement
      pageCount: 35,
      ratingAverage: 5.0,
      ratingCount: 320,
      downloadsCount: 950,
      viewsCount: 4100,
      thumbnailUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=500&auto=format&fit=crop&q=80',
      accessPolicy: {
        create: {
          mode: 'FREE',
          priceAmount: 0,
          currency: 'XOF',
          platformFeeRate: 0,
          contributorRate: 1.0,
        },
      },
    },
  });

  // Publication 6 : Audio Explications Travaux Dirigés Chimie Organique L3 (RÉSERVÉ ÉTUDIANTS BF)
  await prisma.academicResource.upsert({
    where: { slug: 'audio-explications-td-chimie-organique-l3-unb' },
    update: {
      visibility: 'BURKINA_STUDENTS_ONLY',
      validationStatus: 'APPROVED',
    },
    create: {
      id: 'res-audio-chimie-l3',
      authorId: userFatimata.id,
      institutionId: unb.id,
      facultyId: facultyMap['unb-sea'],
      academicLevelId: levelMap['L3'],
      title: 'Enregistrement Audio : Explication Clés des TD de Chimie Organique (L3 UNB)',
      slug: 'audio-explications-td-chimie-organique-l3-unb',
      description: 'Enregistrement vocal clair de 35 minutes détaillant les mécanismes réactionnels SN1/SN2 et éliminations E1/E2 pour les partiels.',
      resourceType: 'TUTORIAL_SHEET',
      moduleName: 'Chimie Organique Avancée',
      academicYear: '2024-2025',
      semester: 'S1',
      badgeQuality: 'Vérifié Commu',
      isCertified: true,
      isTrending: false,
      visibility: 'BURKINA_STUDENTS_ONLY',
      pageCount: 1,
      ratingAverage: 4.7,
      ratingCount: 88,
      downloadsCount: 195,
      viewsCount: 910,
      thumbnailUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=500&auto=format&fit=crop&q=80',
      accessPolicy: {
        create: {
          mode: 'PAID',
          priceAmount: 300,
          currency: 'XOF',
          platformFeeRate: 0.15,
          contributorRate: 0.85,
        },
      },
    },
  });

  console.log('✅ Seed completed successfully with real production actors, Burkina universities, and publications!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

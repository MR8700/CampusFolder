const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

const prisma = new PrismaClient();

async function main() {
  console.log('=== ENRICHISSEMENT ACADÉMIQUE : BURKINA FASO ===');

  // 1. Ensure Country BF exists
  const burkina = await prisma.country.upsert({
    where: { isoCode: 'BF' },
    update: { name: 'Burkina Faso', phoneCode: '+226', flagEmoji: '🇧🇫' },
    create: {
      isoCode: 'BF',
      name: 'Burkina Faso',
      phoneCode: '+226',
      flagEmoji: '🇧🇫',
    },
  });

  // 2. Universities & Higher Education Institutions across all Regions of Burkina Faso
  const institutionsData = [
    // REGION CENTRE (Ouagadougou)
    {
      id: 'inst-ujkz',
      name: 'Université Joseph KI-ZERBO',
      shortName: 'UJKZ (Ouaga 1)',
      type: 'PUBLIC_UNIVERSITY',
      category: 'UNIVERSITE_PUBLIQUE',
      region: 'Centre',
      city: 'Ouagadougou',
      activeStudentsCount: 1420,
      isLive: true,
      logoUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=120&auto=format&fit=crop&q=80',
      websiteUrl: 'https://ujkz.bf',
    },
    {
      id: 'inst-uts',
      name: 'Université Thomas SANKARA',
      shortName: 'UTS (Ouaga 2)',
      type: 'PUBLIC_UNIVERSITY',
      category: 'UNIVERSITE_PUBLIQUE',
      region: 'Centre',
      city: 'Ouagadougou',
      activeStudentsCount: 980,
      isLive: true,
      logoUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=120&auto=format&fit=crop&q=80',
      websiteUrl: 'https://uts.bf',
    },
    {
      id: 'inst-usta',
      name: 'Université Saint Thomas d’Aquin',
      shortName: 'USTA',
      type: 'PRIVATE_UNIVERSITY',
      category: 'UNIVERSITE_PRIVEE',
      region: 'Centre',
      city: 'Ouagadougou',
      activeStudentsCount: 520,
      isLive: true,
      logoUrl: 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=120&auto=format&fit=crop&q=80',
      websiteUrl: 'https://usta.bf',
    },
    {
      id: 'inst-2ie',
      name: 'Institut International d’Ingénierie de l’Eau et de l’Environnement',
      shortName: '2iE Ouaga',
      type: 'PUBLIC_UNIVERSITY',
      category: 'GRANDE_ECOLE',
      region: 'Centre',
      city: 'Ouagadougou',
      activeStudentsCount: 410,
      isLive: true,
      logoUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=120&auto=format&fit=crop&q=80',
      websiteUrl: 'https://2ie-edu.org',
    },
    {
      id: 'inst-aube',
      name: 'Université Aube Nouvelle (ISIG)',
      shortName: 'U-Aube Nouvelle',
      type: 'PRIVATE_UNIVERSITY',
      category: 'UNIVERSITE_PRIVEE',
      region: 'Centre',
      city: 'Ouagadougou',
      activeStudentsCount: 630,
      isLive: true,
      logoUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?w=120&auto=format&fit=crop&q=80',
      websiteUrl: 'https://u-aubenouvelle.bf',
    },
    {
      id: 'inst-esup',
      name: 'École Supérieure Polytechnique de la Jeunesse',
      shortName: 'ESUP-Jeunesse',
      type: 'PRIVATE_UNIVERSITY',
      category: 'INSTITUT_SUPERIEUR',
      region: 'Centre',
      city: 'Ouagadougou',
      activeStudentsCount: 340,
      isLive: true,
      logoUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=120&auto=format&fit=crop&q=80',
      websiteUrl: 'https://esupjeunesse.net',
    },

    // REGION HAUTS-BASSINS (Bobo-Dioulasso)
    {
      id: 'inst-unb',
      name: 'Université Nazi BONI',
      shortName: 'UNB (Bobo)',
      type: 'PUBLIC_UNIVERSITY',
      category: 'UNIVERSITE_PUBLIQUE',
      region: 'Hauts-Bassins',
      city: 'Bobo-Dioulasso',
      activeStudentsCount: 890,
      isLive: true,
      logoUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=120&auto=format&fit=crop&q=80',
      websiteUrl: 'https://univ-bobo.bf',
    },

    // REGION CENTRE-OUEST (Koudougou)
    {
      id: 'inst-unz',
      name: 'Université Norbert ZONGO',
      shortName: 'UNZ (Koudougou)',
      type: 'PUBLIC_UNIVERSITY',
      category: 'UNIVERSITE_PUBLIQUE',
      region: 'Centre-Ouest',
      city: 'Koudougou',
      activeStudentsCount: 780,
      isLive: true,
      logoUrl: 'https://images.unsplash.com/photo-1532649538693-f3a2ec1bf8bd?w=120&auto=format&fit=crop&q=80',
      websiteUrl: 'https://unz.bf',
    },

    // REGION BOUCLE DU MOUHOUN (Dédougou)
    {
      id: 'inst-uddg',
      name: 'Université de Dédougou',
      shortName: 'Univ Dédougou',
      type: 'PUBLIC_UNIVERSITY',
      category: 'UNIVERSITE_PUBLIQUE',
      region: 'Boucle du Mouhoun',
      city: 'Dédougou',
      activeStudentsCount: 420,
      isLive: true,
      logoUrl: 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=120&auto=format&fit=crop&q=80',
      websiteUrl: 'https://univ-dedougou.bf',
    },

    // REGION EST (Fada N'Gourma)
    {
      id: 'inst-ufdg',
      name: 'Université de Fada N’Gourma',
      shortName: 'Univ Fada',
      type: 'PUBLIC_UNIVERSITY',
      category: 'UNIVERSITE_PUBLIQUE',
      region: 'Est',
      city: 'Fada N’Gourma',
      activeStudentsCount: 380,
      isLive: true,
      logoUrl: 'https://images.unsplash.com/photo-1492538368677-f6e0afe31dcc?w=120&auto=format&fit=crop&q=80',
      websiteUrl: 'https://univ-fada.bf',
    },

    // REGION NORD (Ouahigouya)
    {
      id: 'inst-ulbo',
      name: 'Université Lédéa Bernard OUÉDRAOGO',
      shortName: 'Univ Ouahigouya',
      type: 'PUBLIC_UNIVERSITY',
      category: 'UNIVERSITE_PUBLIQUE',
      region: 'Nord',
      city: 'Ouahigouya',
      activeStudentsCount: 360,
      isLive: true,
      logoUrl: 'https://images.unsplash.com/photo-1460518451282-474b15671183?w=120&auto=format&fit=crop&q=80',
      websiteUrl: 'https://univ-ouahigouya.bf',
    },

    // REGION CENTRE-SUD (Manga)
    {
      id: 'inst-cum',
      name: 'Centre Universitaire de Manga',
      shortName: 'CU Manga',
      type: 'PUBLIC_UNIVERSITY',
      category: 'INSTITUT_SUPERIEUR',
      region: 'Centre-Sud',
      city: 'Manga',
      activeStudentsCount: 190,
      isLive: false,
      logoUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=120&auto=format&fit=crop&q=80',
      websiteUrl: 'https://cu-manga.bf',
    },
  ];

  for (const inst of institutionsData) {
    await prisma.institution.upsert({
      where: { id: inst.id },
      update: {
        name: inst.name,
        shortName: inst.shortName,
        type: inst.type,
        category: inst.category,
        region: inst.region,
        city: inst.city,
        activeStudentsCount: inst.activeStudentsCount,
        isLive: inst.isLive,
        logoUrl: inst.logoUrl,
        websiteUrl: inst.websiteUrl,
      },
      create: {
        ...inst,
        countryId: burkina.id,
      },
    });
    console.log(`✓ Établissement synchronisé: ${inst.name} (${inst.region})`);
  }

  // 3. UFR / Facultés & Instituts
  const facultiesData = [
    // UJKZ
    { id: 'fac-sea', institutionId: 'inst-ujkz', name: 'Sciences Exactes & Appliquées (SEA)', code: 'sea', iconName: 'science', activeDocsCount: 142 },
    { id: 'fac-seg', institutionId: 'inst-ujkz', name: 'Sciences Économiques & de Gestion (SEG)', code: 'seg', iconName: 'trending_up', activeDocsCount: 215 },
    { id: 'fac-lac', institutionId: 'inst-ujkz', name: 'Lettres, Arts & Communication (LAC)', code: 'lac', iconName: 'history_edu', activeDocsCount: 114 },
    { id: 'fac-sjp', institutionId: 'inst-ujkz', name: 'Sciences Juridiques & Politiques (SJP)', code: 'sjp', iconName: 'gavel', activeDocsCount: 180 },
    { id: 'fac-sds', institutionId: 'inst-ujkz', name: 'Sciences de la Santé (SDS - Médecine & Pharmacie)', code: 'sds', iconName: 'medical_services', activeDocsCount: 98 },
    { id: 'fac-ibam', institutionId: 'inst-ujkz', name: 'Institut Burkinabè des Arts & Métiers (IBAM)', code: 'ibam', iconName: 'badge', activeDocsCount: 85 },

    // UTS
    { id: 'fac-uts-seg', institutionId: 'inst-uts', name: 'UFR Sciences Économiques & Gestion (UTS)', code: 'uts-seg', iconName: 'query_stats', activeDocsCount: 94 },
    { id: 'fac-uts-sjp', institutionId: 'inst-uts', name: 'UFR Sciences Juridiques & Politiques (UTS)', code: 'uts-sjp', iconName: 'balance', activeDocsCount: 88 },
    { id: 'fac-uts-iufic', institutionId: 'inst-uts', name: 'Institut Univ de Formation Initiale & Continue (IUFIC)', code: 'iufic', iconName: 'workspaces', activeDocsCount: 45 },

    // UNB (Bobo)
    { id: 'fac-unb-esi', institutionId: 'inst-unb', name: 'École Supérieure d’Informatique (ESI Bobo)', code: 'esi', iconName: 'terminal', activeDocsCount: 130 },
    { id: 'fac-unb-inssa', institutionId: 'inst-unb', name: 'Institut Supérieur des Sciences de la Santé (INSSA)', code: 'inssa', iconName: 'stethoscope', activeDocsCount: 92 },
    { id: 'fac-unb-iut', institutionId: 'inst-unb', name: 'Institut Universitaire de Technologie (IUT Bobo)', code: 'iut-bobo', iconName: 'precision_manufacturing', activeDocsCount: 76 },
    { id: 'fac-unb-st', institutionId: 'inst-unb', name: 'UFR Sciences & Techniques (UNB)', code: 'unb-st', iconName: 'biotech', activeDocsCount: 64 },

    // UNZ (Koudougou)
    { id: 'fac-unz-seg', institutionId: 'inst-unz', name: 'UFR Sciences Économiques & Gestion (UNZ)', code: 'unz-seg', iconName: 'finance', activeDocsCount: 82 },
    { id: 'fac-unz-lsh', institutionId: 'inst-unz', name: 'UFR Lettres & Sciences Humaines (UNZ)', code: 'unz-lsh', iconName: 'menu_book', activeDocsCount: 65 },
    { id: 'fac-unz-ens', institutionId: 'inst-unz', name: 'École Normale Supérieure (ENS Koudougou)', code: 'unz-ens', iconName: 'school', activeDocsCount: 54 },

    // 2iE
    { id: 'fac-2ie-eau', institutionId: 'inst-2ie', name: 'Département Eau, Assainissement & Environnement', code: '2ie-eau', iconName: 'water_drop', activeDocsCount: 48 },
    { id: 'fac-2ie-gc', institutionId: 'inst-2ie', name: 'Département Génie Civil, Énergie & Mines', code: '2ie-gc', iconName: 'foundation', activeDocsCount: 52 },

    // USTA
    { id: 'fac-usta-sante', institutionId: 'inst-usta', name: 'Faculté des Sciences de la Santé (USTA)', code: 'usta-sds', iconName: 'emergency', activeDocsCount: 42 },
    { id: 'fac-usta-droit', institutionId: 'inst-usta', name: 'Faculté des Sciences Juridiques & Politiques (USTA)', code: 'usta-sjp', iconName: 'policy', activeDocsCount: 38 },
  ];

  for (const fac of facultiesData) {
    await prisma.faculty.upsert({
      where: { id: fac.id },
      update: {
        name: fac.name,
        code: fac.code,
        iconName: fac.iconName,
        activeDocsCount: fac.activeDocsCount,
      },
      create: fac,
    });
  }
  console.log(`✓ ${facultiesData.length} UFR et Facultés enregistrées`);

  // 4. Filières par UFR (Strict cascading)
  const filieresData = [
    // SEA (UJKZ)
    { id: 'fil-sea-info', facultyId: 'fac-sea', name: 'Informatique & Réseaux', code: 'INFO', degreeLevel: 'LICENCE' },
    { id: 'fil-sea-math', facultyId: 'fac-sea', name: 'Mathématiques Pures & Appliquées', code: 'MATH', degreeLevel: 'LICENCE' },
    { id: 'fil-sea-pc', facultyId: 'fac-sea', name: 'Physique - Chimie (PC)', code: 'PC', degreeLevel: 'LICENCE' },
    { id: 'fil-sea-svt', facultyId: 'fac-sea', name: 'Sciences de la Vie et de la Terre (SVT)', code: 'SVT', degreeLevel: 'LICENCE' },
    { id: 'fil-sea-master-ia', facultyId: 'fac-sea', name: 'Master Data Science & Intelligence Artificielle', code: 'M-IA', degreeLevel: 'MASTER' },

    // SEG (UJKZ)
    { id: 'fil-seg-macro', facultyId: 'fac-seg', name: 'Macroéconomie & Politiques de Développement', code: 'MACRO', degreeLevel: 'LICENCE' },
    { id: 'fil-seg-fisc', facultyId: 'fac-seg', name: 'Finance, Comptabilité & Fiscalité', code: 'FCF', degreeLevel: 'LICENCE' },
    { id: 'fil-seg-gest', facultyId: 'fac-seg', name: 'Management des Organisations & Entreprises', code: 'GEST', degreeLevel: 'LICENCE' },

    // LAC (UJKZ)
    { id: 'fil-lac-ling', facultyId: 'fac-lac', name: 'Linguistique Générale & Langues Nationales', code: 'LING', degreeLevel: 'LICENCE' },
    { id: 'fil-lac-comm', facultyId: 'fac-lac', name: 'Communication & Journalisme', code: 'COMM', degreeLevel: 'LICENCE' },
    { id: 'fil-lac-ang', facultyId: 'fac-lac', name: 'Études Anglophones', code: 'ANG', degreeLevel: 'LICENCE' },

    // SJP (UJKZ)
    { id: 'fil-sjp-priv', facultyId: 'fac-sjp', name: 'Droit Privé & Carrières Judiciaires', code: 'DRT-PRV', degreeLevel: 'LICENCE' },
    { id: 'fil-sjp-pub', facultyId: 'fac-sjp', name: 'Droit Public & Administration', code: 'DRT-PUB', degreeLevel: 'LICENCE' },
    { id: 'fil-sjp-scpol', facultyId: 'fac-sjp', name: 'Sciences Politiques & Relations Internationales', code: 'SC-POL', degreeLevel: 'LICENCE' },

    // SDS (UJKZ)
    { id: 'fil-sds-med', facultyId: 'fac-sds', name: 'Médecine Générale (Doctorat d’État)', code: 'MED', degreeLevel: 'DOCTORAT' },
    { id: 'fil-sds-pharm', facultyId: 'fac-sds', name: 'Pharmacie (Doctorat d’État)', code: 'PHARM', degreeLevel: 'DOCTORAT' },

    // IBAM (UJKZ)
    { id: 'fil-ibam-bank', facultyId: 'fac-ibam', name: 'Banque & Assurances', code: 'BANK', degreeLevel: 'LICENCE' },
    { id: 'fil-ibam-mkt', facultyId: 'fac-ibam', name: 'Marketing & Gestion Commerciale', code: 'MKT', degreeLevel: 'LICENCE' },

    // ESI (Bobo)
    { id: 'fil-esi-gl', facultyId: 'fac-unb-esi', name: 'Génie Logiciel & Systèmes d’Information', code: 'GL', degreeLevel: 'INGENIEUR' },
    { id: 'fil-esi-rt', facultyId: 'fac-unb-esi', name: 'Réseaux & Télécommunications', code: 'RT', degreeLevel: 'INGENIEUR' },

    // INSSA (Bobo)
    { id: 'fil-inssa-med', facultyId: 'fac-unb-inssa', name: 'Médecine Humaine', code: 'MED-BOBO', degreeLevel: 'DOCTORAT' },

    // 2iE
    { id: 'fil-2ie-hydro', facultyId: 'fac-2ie-eau', name: 'Hydraulique & Traitement des Eaux', code: 'HYDRO', degreeLevel: 'INGENIEUR' },
    { id: 'fil-2ie-gc', facultyId: 'fac-2ie-gc', name: 'Bâtiment & Travaux Publics (BTP)', code: 'BTP', degreeLevel: 'INGENIEUR' },
  ];

  for (const fil of filieresData) {
    await prisma.filiere.upsert({
      where: { id: fil.id },
      update: {
        name: fil.name,
        code: fil.code,
        degreeLevel: fil.degreeLevel,
      },
      create: fil,
    });
  }
  console.log(`✓ ${filieresData.length} Filières académiques réelles enregistrées`);

  // 5. Admin Anti-Speculation & Pricing Ceiling Rules (Barèmes Officiels de l'Administration)
  const pricingRules = [
    {
      id: 'rule-corrige',
      title: 'Barème Officiel : Corrigés d’Évaluations & Devoirs',
      documentType: 'EXAM_CORRECTION',
      mediaFormat: 'ALL',
      minPrice: 0,
      maxPrice: 1000,
      suggestedPrice: 400,
      notes: 'Plafond strict à 1000 FCFA pour garantir l’accessibilité solidaire aux étudiants.',
    },
    {
      id: 'rule-these',
      title: 'Barème Thèses de Doctorat & Soutenances',
      documentType: 'THESE_SOUTENANCE',
      mediaFormat: 'ALL',
      minPrice: 0,
      maxPrice: 3500,
      suggestedPrice: 1500,
      notes: 'Encadrement tarifaire des documents de soutenance et thèses validées par le jury.',
    },
    {
      id: 'rule-memoire',
      title: 'Barème Mémoires de Master & Fin de Cycle',
      documentType: 'MEMOIRE_MASTER',
      mediaFormat: 'ALL',
      minPrice: 0,
      maxPrice: 2500,
      suggestedPrice: 1000,
      notes: 'Mémoires de Licence 3 et Master 2 certifiés.',
    },
    {
      id: 'rule-cours',
      title: 'Barème Fiches de Synthèse & Cours Magistraux',
      documentType: 'COURSE_NOTES',
      mediaFormat: 'ALL',
      minPrice: 0,
      maxPrice: 800,
      suggestedPrice: 300,
      notes: 'Notes de cours rédigées et synthèses amphi.',
    },
    {
      id: 'rule-concours',
      title: 'Barème Annales Concours Directs Fonction Publique BF',
      documentType: 'CONCOURS_TEST',
      mediaFormat: 'ALL',
      minPrice: 0,
      maxPrice: 1200,
      suggestedPrice: 500,
      notes: 'Préparations tests d’intégration, douanes, ENAREF, santé, éducation.',
    },
    {
      id: 'rule-formation',
      title: 'Barème Ateliers Pratiques & Masterclasses Certifiées',
      documentType: 'FORMATION_ATELIER',
      mediaFormat: 'ALL',
      minPrice: 0,
      maxPrice: 5000,
      suggestedPrice: 2000,
      notes: 'Sessions interactives animées par des majors et professionnels.',
    },
  ];

  for (const rule of pricingRules) {
    await prisma.pricingCeilingRule.upsert({
      where: { id: rule.id },
      update: rule,
      create: rule,
    });
  }
  console.log(`✓ ${pricingRules.length} Barèmes tarifaires administratifs configurés`);

  // 6. Ensure ADMIN Role and Master Admin Account
  const adminRole = await prisma.role.upsert({
    where: { code: 'ADMIN' },
    update: { name: 'Administrateur Plateforme' },
    create: {
      code: 'ADMIN',
      name: 'Administrateur Plateforme',
      description: 'Gestion globale des universités, UFR, filières, modération et barèmes tarifaires',
    },
  });

  const moderatorRole = await prisma.role.upsert({
    where: { code: 'MODERATOR' },
    update: { name: 'Modérateur Académique' },
    create: {
      code: 'MODERATOR',
      name: 'Modérateur Académique',
      description: 'Contrôle des documents et modération des étudiants',
    },
  });

  // Password: Password@2025!
  const passwordHash = hashPassword('Password@2025!');

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@campusfolder.bf' },
    update: {
      ine: 'ADM-BF-2025-01',
      status: 'ACTIVE',
      isSuspended: false,
    },
    create: {
      id: 'user-admin-master',
      email: 'admin@campusfolder.bf',
      ine: 'ADM-BF-2025-01',
      phoneNumber: '+22670000001',
      passwordHash,
      status: 'ACTIVE',
      points: 9999,
      emailVerified: true,
      phoneVerified: true,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });

  await prisma.profile.upsert({
    where: { userId: adminUser.id },
    update: {
      displayName: 'Direction Campus Folder BF',
      institutionId: 'inst-ujkz',
    },
    create: {
      userId: adminUser.id,
      firstName: 'Admin',
      lastName: 'National',
      displayName: 'Direction Campus Folder BF',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
      bio: 'Administration Centrale & Régulation Académique • Burkina Faso',
      institutionId: 'inst-ujkz',
      countryCode: 'BF',
      region: 'Centre',
      city: 'Ouagadougou',
    },
  });
  console.log(`✓ Compte Administrateur configuré: admin@campusfolder.bf (Pass: Password@2025!)`);

  console.log('=== ENRICHISSEMENT ACADÉMIQUE ACHEVÉ AVEC SUCCÈS ===');
}

main()
  .catch((e) => {
    console.error('Erreur seed académique:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

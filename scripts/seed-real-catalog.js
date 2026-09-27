const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const LOCAL_DOCS_DIR = 'C:\\Users\\Richard\\Documents\\LycéeCours';
const LOCAL_VIDEOS_DIR = 'C:\\Users\\Richard\\Videos\\Video';
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');
const COURSES_DEST = path.join(UPLOADS_DIR, 'courses');
const VIDEOS_DEST = path.join(UPLOADS_DIR, 'videos');

function sanitizeSlug(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function getAllFiles(dir, exts) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllFiles(fullPath, exts));
    } else {
      const ext = path.extname(file).toLowerCase();
      if (exts.includes(ext)) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

async function main() {
  console.log('🚀 Démarrage du peuplement réel Campus Folder...');

  // 1. Ensure target upload directories exist
  fs.mkdirSync(COURSES_DEST, { recursive: true });
  fs.mkdirSync(VIDEOS_DEST, { recursive: true });

  // 2. Load core references
  const users = await prisma.user.findMany({ select: { id: true, email: true } });
  const instUjkz = await prisma.institution.findFirst({ where: { shortName: { contains: 'UJKZ' } } });
  const instUts = await prisma.institution.findFirst({ where: { shortName: { contains: 'UTS' } } }) || instUjkz;

  const facSea = await prisma.faculty.findFirst({ where: { code: 'sea' } });
  const facLac = await prisma.faculty.findFirst({ where: { code: 'lac' } });
  const facSeg = await prisma.faculty.findFirst({ where: { code: 'seg' } });
  const facSjp = await prisma.faculty.findFirst({ where: { code: 'sjp' } });
  const facSds = await prisma.faculty.findFirst({ where: { code: 'sds' } });

  // Ensure Terminale / Bac academic level exists
  let levelTle = await prisma.academicLevel.findFirst({ where: { code: 'TLE' } });
  if (!levelTle) {
    levelTle = await prisma.academicLevel.create({
      data: {
        code: 'TLE',
        label: 'Terminale / Baccalauréat',
        rank: 0,
      },
    });
    console.log('✅ Niveau académique Terminale créé');
  }

  const levelL1 = await prisma.academicLevel.findFirst({ where: { code: 'L1' } });
  const levelL2 = await prisma.academicLevel.findFirst({ where: { code: 'L2' } }) || levelL1;
  const levelL3 = await prisma.academicLevel.findFirst({ where: { code: 'L3' } }) || levelL1;

  // 3. Scan & Ingest Local Documents from LycéeCours
  console.log(`📂 Analyse des documents dans ${LOCAL_DOCS_DIR}...`);
  const docFiles = getAllFiles(LOCAL_DOCS_DIR, ['.pdf']);
  console.log(`Trouvé ${docFiles.length} fichiers PDF locaux.`);

  let docsCreated = 0;
  const seenFileNames = new Set();

  for (const srcPath of docFiles) {
    const rawFileName = path.basename(srcPath);
    if (seenFileNames.has(rawFileName.toLowerCase())) continue;
    seenFileNames.add(rawFileName.toLowerCase());

    const cleanBaseName = rawFileName
      .replace(/[^a-zA-Z0-9_\-\.]/g, '_')
      .replace(/_+/g, '_');
    const destPath = path.join(COURSES_DEST, cleanBaseName);

    // Copy file if not exists
    if (!fs.existsSync(destPath)) {
      try {
        fs.copyFileSync(srcPath, destPath);
      } catch (err) {
        console.warn(`Impossible de copier ${srcPath}:`, err.message);
      }
    }

    const stat = fs.existsSync(destPath) ? fs.statSync(destPath) : { size: 1024 * 300 };

    // Pedagogical classification
    const lowerName = rawFileName.toLowerCase();
    let title = rawFileName.replace(/\.pdf$/i, '').replace(/[\-_]/g, ' ');
    let moduleName = 'Sciences Physiques & Chimie';
    let faculty = facSea;
    let resourceType = 'COURSE_NOTES';
    let isFree = Math.random() > 0.45; // 45% free, 55% paid
    let priceAmount = isFree ? 0 : [300, 500, 600, 750, 1000][Math.floor(Math.random() * 5)];
    let author = users[Math.floor(Math.random() * users.length)];

    if (lowerName.includes('chimie') || lowerName.includes('solution') || lowerName.includes('acide') || lowerName.includes('alcool') || lowerName.includes('ester')) {
      moduleName = 'Chimie Générale & Organique';
      title = `Chimie Tle D/C : ${title}`;
    } else if (lowerName.includes('condensateur') || lowerName.includes('bobine') || lowerName.includes('oscillation') || lowerName.includes('electricit')) {
      moduleName = 'Physique - Électricité & Circuits';
      title = `Physique Tle D/C : ${title}`;
    } else if (lowerName.includes('newton') || lowerName.includes('cinematique') || lowerName.includes('mecanique') || lowerName.includes('gravitation')) {
      moduleName = 'Physique - Mécanique & Cinématique';
      title = `Mécanique Tle D/C : ${title}`;
    } else if (lowerName.includes('noyau') || lowerName.includes('nucleaire') || lowerName.includes('radioactivit')) {
      moduleName = 'Physique Nucléaire & Atomique';
      title = `Physique Nucléaire Tle : ${title}`;
    } else if (lowerName.includes('sujet') || lowerName.includes('reponse') || lowerName.includes('pm') || lowerName.includes('explication')) {
      moduleName = 'Annales & Corrigés Examens Bac';
      resourceType = 'EXAM_CORRECTION';
      title = `Annales & Sujets d'Examen : ${title}`;
      priceAmount = isFree ? 0 : 500;
    }

    const slug = `${sanitizeSlug(title)}-${Date.now().toString(36)}-${Math.floor(Math.random() * 900 + 100)}`;
    const storagePath = `/uploads/courses/${cleanBaseName}`;

    try {
      await prisma.academicResource.create({
        data: {
          authorId: author.id,
          institutionId: instUjkz.id,
          facultyId: (faculty || facSea).id,
          academicLevelId: levelTle.id,
          title: title.substring(0, 180),
          slug,
          description: `Document académique officiel : ${title}. Support d'étude complet avec résumés de cours, théorèmes clés, méthodes d'application directe et exercices d'entraînement progressifs pour lycéens et bacheliers.`,
          resourceType,
          moduleName,
          academicYear: '2024-2025',
          semester: 'S1',
          urgencyBanner: lowerName.includes('sujet') ? 'Spécial Révisions & Baccalauréat 2025' : null,
          badgeQuality: Math.random() > 0.3 ? 'Vérifié A+' : 'Vérifié Commu',
          isCertified: true,
          isTrending: Math.random() > 0.6,
          pageCount: Math.floor(Math.random() * 25 + 5),
          ratingAverage: parseFloat((4.5 + Math.random() * 0.5).toFixed(1)),
          ratingCount: Math.floor(Math.random() * 38 + 6),
          downloadsCount: Math.floor(Math.random() * 140 + 15),
          viewsCount: Math.floor(Math.random() * 600 + 80),
          thumbnailUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCnleFEQlJt-dnss1cLqHYIsNjS6BplHmwvWLGH2nWX6e7mryDrah1CR5gtCBNyRhxI05vsY4vQG-G2ye9O9_YWFdGOaNHwKs2-aKxbWa18-wLYErNZnxpMfEKOdR4LgaLkCLThibmYxzu90mzUOVdk0G6zBIEOfciI0t27Mdr68ZMMcQXfew8xE2OvcweZuzA7M8YlbAmP8KtODtsxps_UzNnxn9gpL-1ISJksp9xwl8PP77k0tAAS8g',
          validationStatus: 'APPROVED',
          validatedAt: new Date(),
          validatedBy: 'ADMIN',
          visibility: 'PUBLIC',
          targetAudience: 'STUDENTS_AND_PUBLIC',
          accessPolicy: {
            create: {
              mode: isFree ? 'FREE' : 'PAID',
              priceAmount,
              currency: 'XOF',
              platformFeeRate: 0.40,
              contributorRate: 0.60,
              allowOffline: true,
            },
          },
          media: {
            create: [
              {
                mediaType: 'PDF',
                originalFilename: rawFileName,
                storagePath,
                mimeType: 'application/pdf',
                sizeBytes: stat.size,
                isMasterFile: true,
                orderIndex: 1,
                labelBadge: 'Document Complet (Haute Qualité)',
              },
            ],
          },
        },
      });
      docsCreated++;
    } catch (e) {
      console.warn(`Erreur insertion doc ${rawFileName}:`, e.message);
    }
  }
  console.log(`✅ ${docsCreated} documents pédagogiques créés et intégrés au catalogue.`);

  // 4. Scan & Ingest Local Videos from Video
  console.log(`🎬 Analyse des vidéos dans ${LOCAL_VIDEOS_DIR}...`);
  const videoFiles = getAllFiles(LOCAL_VIDEOS_DIR, ['.mp4', '.webm']);
  console.log(`Trouvé ${videoFiles.length} vidéos locales.`);

  let videosCreated = 0;
  for (const vPath of videoFiles) {
    const rawName = path.basename(vPath);
    const cleanVidName = rawName.replace(/[^a-zA-Z0-9_\-\.]/g, '_').replace(/_+/g, '_');
    const destVidPath = path.join(VIDEOS_DEST, cleanVidName);

    if (!fs.existsSync(destVidPath)) {
      try {
        fs.copyFileSync(vPath, destVidPath);
      } catch (err) {
        console.warn(`Impossible de copier vidéo ${vPath}:`, err.message);
      }
    }

    const stat = fs.existsSync(destVidPath) ? fs.statSync(destVidPath) : { size: 1024 * 1024 * 15 };
    const lowerVid = rawName.toLowerCase();

    let title = rawName.replace(/\.mp4$/i, '').replace(/[\-_]/g, ' ');
    if (lowerVid.includes('piano') || lowerVid.includes('tuto')) {
      title = `Masterclass Piano & Pratique Musicale : ${title}`;
    } else {
      title = `Atelier Artistique & Scène : ${title}`;
    }

    const isFree = Math.random() > 0.4;
    const priceAmount = isFree ? 0 : [500, 1000, 1500][Math.floor(Math.random() * 3)];
    const author = users[Math.floor(Math.random() * users.length)];
    const slug = `${sanitizeSlug(title)}-${Date.now().toString(36)}-${Math.floor(Math.random() * 900 + 100)}`;
    const storagePath = `/uploads/videos/${cleanVidName}`;

    try {
      await prisma.academicResource.create({
        data: {
          authorId: author.id,
          institutionId: instUjkz.id,
          facultyId: (facLac || facSea).id,
          academicLevelId: levelL1.id,
          title: title.substring(0, 180),
          slug,
          description: `Masterclass vidéo haute définition : ${title}. Session pratique filmée étape par étape avec explications pédagogiques, démonstrations concrètes et grille d'apprentissage pour les étudiants et passionnés.`,
          resourceType: 'FORMATION_ATELIER',
          moduleName: 'Arts & Techniques Audiovisuelles',
          academicYear: '2024-2025',
          semester: 'S1',
          urgencyBanner: 'Masterclass Vidéo HD • Disponible en streaming 206',
          badgeQuality: 'Officiel',
          isCertified: true,
          isTrending: true,
          pageCount: 1,
          ratingAverage: 4.9,
          ratingCount: Math.floor(Math.random() * 50 + 12),
          downloadsCount: Math.floor(Math.random() * 85 + 20),
          viewsCount: Math.floor(Math.random() * 850 + 150),
          thumbnailUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
          validationStatus: 'APPROVED',
          validatedAt: new Date(),
          validatedBy: 'ADMIN',
          visibility: 'PUBLIC',
          targetAudience: 'STUDENTS_AND_PUBLIC',
          accessPolicy: {
            create: {
              mode: isFree ? 'FREE' : 'PAID',
              priceAmount,
              currency: 'XOF',
              platformFeeRate: 0.40,
              contributorRate: 0.60,
              allowOffline: true,
            },
          },
          media: {
            create: [
              {
                mediaType: 'VIDEO',
                originalFilename: rawName,
                storagePath,
                mimeType: 'video/mp4',
                sizeBytes: stat.size,
                durationSeconds: Math.floor(Math.random() * 450 + 180),
                isMasterFile: true,
                orderIndex: 1,
                labelBadge: 'Vidéo HD 720p',
              },
            ],
          },
        },
      });
      videosCreated++;
    } catch (e) {
      console.warn(`Erreur insertion vidéo ${rawName}:`, e.message);
    }
  }
  console.log(`✅ ${videosCreated} vidéos locales intégrées au catalogue.`);

  // 5. Ingest Curated High-Impact Online YouTube Educational Resources
  console.log('🌐 Ajout des ressources éducatives YouTube en ligne...');
  const onlineVideos = [
    {
      title: 'Algèbre Linéaire L1 : Espaces Vectoriels, Sous-espaces & Bases (Essence)',
      moduleName: 'Algèbre Linéaire & Géométrie',
      faculty: facSea,
      level: levelL1,
      youtubeUrl: 'https://www.youtube.com/watch?v=fNk_zzaMoSs',
      description: 'Compréhension géométrique intuitive et rigoureuse des espaces vectoriels, des combinaisons linéaires, des dimensions et du rang d’une famille de vecteurs. Cours vidéo incontournable pour les étudiants de Licence 1 Mathématiques et Physique.',
      isFree: true,
      price: 0,
      resourceType: 'COURSE_NOTES',
      thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop&q=80',
    },
    {
      title: 'Analyse L1 : Dérivées, Équations Différentielles & Développements Limités',
      moduleName: 'Analyse Mathématique',
      faculty: facSea,
      level: levelL1,
      youtubeUrl: 'https://www.youtube.com/watch?v=WUvTyaaNkzM',
      description: 'Leçons visuelles sur le calcul infinitésimal, le théorème des accroissements finis et la résolution méthodique des équations différentielles ordinaires d’ordre 1 et 2.',
      isFree: true,
      price: 0,
      resourceType: 'COURSE_NOTES',
      thumbnail: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&auto=format&fit=crop&q=80',
    },
    {
      title: 'Macroéconomie L2 : Le Modèle IS-LM et la Politique Monétaire BCEAO',
      moduleName: 'Macroéconomie Approfondie',
      faculty: facSeg,
      level: levelL2,
      youtubeUrl: 'https://www.youtube.com/watch?v=1x8cSm3CgXQ',
      description: 'Analyse complète de l’équilibre macroéconomique sur les marchés des biens et de la monnaie. Simulation des chocs de politique budgétaire et monétaire dans l’espace UEMOA.',
      isFree: false,
      price: 600,
      resourceType: 'COURSE_NOTES',
      thumbnail: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&auto=format&fit=crop&q=80',
    },
    {
      title: 'Droit Constitutionnel : La Séparation des Pouvoirs et Régimes Politiques en Afrique',
      moduleName: 'Droit Constitutionnel & Institutions Politiques',
      faculty: facSjp,
      level: levelL1,
      youtubeUrl: 'https://www.youtube.com/watch?v=6rL4Fp0_Kk8',
      description: 'Étude comparée des régimes présidentiel, parlementaire et semi-présidentiel. Focus sur la constitution burkinabè, la hiérarchie des normes et le rôle du Conseil Constitutionnel.',
      isFree: true,
      price: 0,
      resourceType: 'COURSE_NOTES',
      thumbnail: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80',
    },
    {
      title: 'Algorithmique & Structures de Données : Arbres Binaires, Heap & Graphes BFS/DFS',
      moduleName: 'Informatique Fondamentale',
      faculty: facSea,
      level: levelL2,
      youtubeUrl: 'https://www.youtube.com/watch?v=RBSGKlAvoiM',
      description: 'Masterclass sur les structures hiérarchiques et non linéaires : arbres binaires de recherche (BST), équilibrage AVL, tas et algorithmes de parcours de graphes avec calcul de complexité temporelle O(N).',
      isFree: false,
      price: 750,
      resourceType: 'FORMATION_ATELIER',
      thumbnail: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&auto=format&fit=crop&q=80',
    },
    {
      title: 'Physiologie Cardiovasculaire L2 : Pression Artérielle & Régulation Neuro-Végétative',
      moduleName: 'Physiologie Humaine',
      faculty: facSds,
      level: levelL2,
      youtubeUrl: 'https://www.youtube.com/watch?v=gYnsw9y9_aM',
      description: 'Cours magistral illustré sur la mécanique cardiaque, le cycle systole/diastole, l’innervation autonome et les mécanismes de régulation du débit cardiaque chez l’adulte sain.',
      isFree: false,
      price: 1000,
      resourceType: 'COURSE_NOTES',
      thumbnail: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=80',
    },
    {
      title: 'Baccalauréat Scientifique : Résolution Guidée des Épreuves de Mathématiques C & D',
      moduleName: 'Mathématiques Terminale C & D',
      faculty: facSea,
      level: levelTle,
      youtubeUrl: 'https://www.youtube.com/watch?v=kYJv8y76aD4',
      description: 'Corrigé pas à pas d’épreuves types du Baccalauréat en direct par des majors : suites numériques, études de fonctions logarithme/exponentielle, intégration et probabilités.',
      isFree: true,
      price: 0,
      resourceType: 'EXAM_CORRECTION',
      thumbnail: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=80',
    }
  ];

  let onlineCreated = 0;
  for (const item of onlineVideos) {
    const slug = `${sanitizeSlug(item.title)}-${Date.now().toString(36)}-${Math.floor(Math.random() * 900 + 100)}`;
    const author = users[Math.floor(Math.random() * users.length)];

    try {
      await prisma.academicResource.create({
        data: {
          authorId: author.id,
          institutionId: instUjkz.id,
          facultyId: (item.faculty || facSea).id,
          academicLevelId: item.level.id,
          title: item.title,
          slug,
          description: item.description,
          resourceType: item.resourceType,
          moduleName: item.moduleName,
          academicYear: '2024-2025',
          semester: 'S1',
          urgencyBanner: item.price > 0 ? 'Formation Recommandée • 60% Reversés à l’Auteur' : null,
          badgeQuality: 'Vérifié A+',
          isCertified: true,
          isTrending: true,
          pageCount: 1,
          ratingAverage: 5.0,
          ratingCount: Math.floor(Math.random() * 65 + 20),
          downloadsCount: Math.floor(Math.random() * 120 + 35),
          viewsCount: Math.floor(Math.random() * 1200 + 400),
          thumbnailUrl: item.thumbnail,
          validationStatus: 'APPROVED',
          validatedAt: new Date(),
          validatedBy: 'ADMIN',
          visibility: 'PUBLIC',
          targetAudience: 'STUDENTS_AND_PUBLIC',
          accessPolicy: {
            create: {
              mode: item.isFree ? 'FREE' : 'PAID',
              priceAmount: item.price,
              currency: 'XOF',
              platformFeeRate: 0.40,
              contributorRate: 0.60,
              allowOffline: true,
            },
          },
          media: {
            create: [
              {
                mediaType: 'VIDEO',
                originalFilename: `${item.title.substring(0, 40)}.mp4`,
                storagePath: item.youtubeUrl,
                mimeType: 'video/youtube',
                sizeBytes: 1024 * 1024 * 45,
                durationSeconds: Math.floor(Math.random() * 900 + 600),
                isMasterFile: true,
                orderIndex: 1,
                labelBadge: 'YouTube HD • Pédagogique',
              },
            ],
          },
        },
      });
      onlineCreated++;
    } catch (err) {
      console.warn(`Erreur insertion YouTube ${item.title}:`, err.message);
    }
  }

  const finalTotal = await prisma.academicResource.count();
  console.log(`🎉 Ingestion terminée avec succès !`);
  console.log(`- Total ressources créées dans ce run : ${docsCreated + videosCreated + onlineCreated}`);
  console.log(`- Total ressources dans la plateforme : ${finalTotal}`);
}

main()
  .catch((e) => {
    console.error('Fatal seeding error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

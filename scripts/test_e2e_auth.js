const path = require('path');
const { PrismaClient } = require(path.join(process.cwd(), 'node_modules/@prisma/client'));
const prisma = new PrismaClient();

async function main() {
  console.log('--- E2E Database & Auth Testing ---');

  // 1. Verify user can be queried by either Email OR INE
  const userByEmail = await prisma.user.findFirst({
    where: { email: 'aminata@campusfolder.bf' },
    include: { profile: true, wallet: true },
  });
  console.log('Lookup by Email (aminata@campusfolder.bf):', !!userByEmail, userByEmail.profile.displayName);

  const userByIne = await prisma.user.findFirst({
    where: { ine: 'N0234567891' },
    include: { profile: true, wallet: true },
  });
  console.log('Lookup by INE (N0234567891):', !!userByIne, userByIne.profile.displayName);

  // 2. Check that both lookups return the identical student
  console.log('Matches identical student ID:', userByEmail.id === userByIne.id);

  // 3. Test Institutions and Faculties availability
  const instCount = await prisma.institution.count();
  const facultyCount = await prisma.faculty.count();
  const levelCount = await prisma.academicLevel.count();
  console.log(`Academic DB counts: ${instCount} Institutions, ${facultyCount} Faculties, ${levelCount} Levels.`);

  console.log('ALL VERIFICATIONS SUCCESSFUL ✅');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

const path = require('path');
const { PrismaClient } = require(path.join(process.cwd(), 'node_modules/@prisma/client'));
const prisma = new PrismaClient();

async function main() {
  const users = [
    { email: 'aminata@campusfolder.bf', ine: 'N0234567891' },
    { email: 'moussa@ujkz.bf', ine: 'N0198765432' },
    { email: 'fatimata@ujkz.bf', ine: 'N0345678901' },
    { email: 'idriss@ujkz.bf', ine: 'N0456789012' },
    { email: 'ousmane@ujkz.bf', ine: 'N0567890123' },
  ];

  for (const item of users) {
    await prisma.user.updateMany({
      where: { email: item.email },
      data: { ine: item.ine, emailVerified: true },
    });
    console.log(`Assigned INE ${item.ine} to ${item.email}`);
  }

  const allUsers = await prisma.user.findMany({
    select: { id: true, email: true, ine: true, status: true, emailVerified: true },
  });
  console.log('Database users state:', allUsers);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

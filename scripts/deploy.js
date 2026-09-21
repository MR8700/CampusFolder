const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('--- CampusFolder Automated Deployment ---');

// 1. Resolve connection strings from Vercel / Supabase environment variables
const pooledUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL;

const directUrl =
  process.env.DIRECT_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  pooledUrl;

// For schema changes and index creation, direct connection is optimal
const migrationUrl = directUrl || pooledUrl;

if (migrationUrl) {
  console.log('✅ Database connection detected.');

  // Ensure .env has DATABASE_URL for Prisma CLI
  const envPath = path.join(process.cwd(), '.env');
  let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

  if (!envContent.includes('DATABASE_URL=')) {
    envContent += `\nDATABASE_URL="${migrationUrl}"\n`;
  } else {
    envContent = envContent.replace(/DATABASE_URL=.*/g, `DATABASE_URL="${migrationUrl}"`);
  }
  fs.writeFileSync(envPath, envContent);

  // 2. Automate schema and index creation
  try {
    console.log('🚀 Synchronizing Prisma schema and 25+ indexes with database...');
    execSync('npx prisma db push --skip-generate', {
      stdio: 'inherit',
      env: {
        ...process.env,
        DATABASE_URL: migrationUrl,
      },
    });
    console.log('✅ Database schema and indexes synchronized successfully!');
  } catch (error) {
    console.warn('⚠️ Warning during db push (continuing build):', error.message);
  }
} else {
  console.warn('⚠️ Warning: No database connection found in environment variables.');
  console.warn('   (DATABASE_URL, POSTGRES_PRISMA_URL, or POSTGRES_URL).');
  console.warn('   Please connect Supabase in your Vercel project Storage/Integrations.');
}

// 3. Build Next.js
console.log('🏗️ Building Next.js 15 application...');
execSync('npx next build', { stdio: 'inherit', env: process.env });

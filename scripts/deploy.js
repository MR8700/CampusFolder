const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { detectAndConfigureDatabase } = require('./prepare-prisma');

console.log('--- CampusFolder Automated Production Deployment ---');

// 1. Automatically adapt schema and generate correct Prisma Client (PostgreSQL vs SQLite)
detectAndConfigureDatabase();

const isPostgres =
  Boolean(process.env.DATABASE_URL && (process.env.DATABASE_URL.startsWith('postgres://') || process.env.DATABASE_URL.startsWith('postgresql://'))) ||
  Boolean(process.env.DIRECT_URL && (process.env.DIRECT_URL.startsWith('postgres://') || process.env.DIRECT_URL.startsWith('postgresql://')));

const migrationUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (isPostgres && migrationUrl) {
  console.log('🐘 PostgreSQL production database target detected.');

  // 2. Synchronize schema & 25+ indexes with PostgreSQL database
  try {
    console.log('🚀 Synchronizing Prisma schema and indexes with PostgreSQL...');
    execSync('npx prisma db push --skip-generate --accept-data-loss', {
      stdio: 'inherit',
      env: {
        ...process.env,
        DATABASE_URL: migrationUrl,
      },
    });
    console.log('✅ PostgreSQL schema and indexes synchronized successfully!');
  } catch (error) {
    console.warn('⚠️ Warning during PostgreSQL schema push (continuing build):', error.message);
  }

  // 3. Seed referentials, Super Admin, and academic resources
  try {
    console.log('🌱 Synchronizing real actors, Burkina institutions, and resources...');
    execSync('node prisma/seed.js', {
      stdio: 'inherit',
      env: {
        ...process.env,
        DATABASE_URL: migrationUrl,
      },
    });
    console.log('✅ Database seeding completed successfully!');
  } catch (seedErr) {
    console.warn('⚠️ Warning during database seed (continuing build):', seedErr.message);
  }
} else {
  console.log('📁 SQLite target detected.');
  const isVercel = process.env.VERCEL === '1' || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);

  if (isVercel) {
    console.log('☁️ Vercel serverless environment detected. Initializing SQLite in /tmp/dev.db...');
    try {
      execSync('npx prisma db push --skip-generate --accept-data-loss', {
        stdio: 'inherit',
        env: {
          ...process.env,
          DATABASE_URL: 'file:/tmp/dev.db',
        },
      });
      execSync('node prisma/seed.js', {
        stdio: 'inherit',
        env: {
          ...process.env,
          DATABASE_URL: 'file:/tmp/dev.db',
        },
      });
      console.log('✅ /tmp/dev.db ready for serverless build.');
    } catch (e) {
      console.warn('⚠️ Notice during serverless SQLite setup:', e.message);
    }
  } else {
    console.log('💻 Local development environment detected.');
  }
}

// 4. Build Next.js 15 application
console.log('🏗️ Building Next.js 15 application...');
execSync('npx next build', {
  stdio: 'inherit',
  env: process.env,
});

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function detectAndConfigureDatabase() {
  console.log('🔧 [Prisma Config] Detecting database environment...');

  // 1. Resolve candidate connection strings from Vercel / Supabase / Neon / Local env
  const postgresUrl =
    process.env.POSTGRES_PRISMA_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL;

  const directUrl =
    process.env.DIRECT_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    postgresUrl;

  const isPostgres = Boolean(
    (postgresUrl && (postgresUrl.startsWith('postgres://') || postgresUrl.startsWith('postgresql://'))) ||
    (directUrl && (directUrl.startsWith('postgres://') || directUrl.startsWith('postgresql://')))
  );

  const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
  if (!fs.existsSync(schemaPath)) {
    console.error('❌ [Prisma Config] schema.prisma not found at:', schemaPath);
    return;
  }

  let schemaContent = fs.readFileSync(schemaPath, 'utf8');

  // Match the datasource db { ... } block
  const datasourceRegex = /datasource\s+db\s*\{[\s\S]*?\}/;

  if (isPostgres) {
    console.log('🐘 [Prisma Config] PostgreSQL detected. Adapting schema for PostgreSQL...');
    const pgDatasource = `datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}`;
    schemaContent = schemaContent.replace(datasourceRegex, pgDatasource);

    process.env.DATABASE_URL = postgresUrl;
    process.env.DIRECT_URL = directUrl || postgresUrl;

    updateEnvFile({
      DATABASE_URL: postgresUrl,
      DIRECT_URL: directUrl || postgresUrl,
    });
  } else {
    console.log('📁 [Prisma Config] SQLite / local database detected. Adapting schema for SQLite...');
    const sqliteDatasource = `datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}`;
    schemaContent = schemaContent.replace(datasourceRegex, sqliteDatasource);

    const isVercel = process.env.VERCEL === '1' || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);
    let resolvedDbUrl = process.env.DATABASE_URL;

    if (!resolvedDbUrl || (!resolvedDbUrl.startsWith('file:') && !resolvedDbUrl.startsWith('sqlite:'))) {
      if (isVercel) {
        resolvedDbUrl = 'file:/tmp/dev.db';
        try {
          const localDb = path.join(process.cwd(), 'prisma', 'dev.db');
          if (fs.existsSync(localDb) && !fs.existsSync('/tmp/dev.db')) {
            fs.copyFileSync(localDb, '/tmp/dev.db');
            console.log('📋 [Prisma Config] Copied pre-seeded prisma/dev.db to /tmp/dev.db');
          }
        } catch (e) {
          console.warn('⚠️ [Prisma Config] Could not copy to /tmp/dev.db:', e.message);
        }
      } else {
        resolvedDbUrl = 'file:./dev.db';
      }
    }

    process.env.DATABASE_URL = resolvedDbUrl;
    updateEnvFile({
      DATABASE_URL: resolvedDbUrl,
    });
  }

  // Ensure generator client has binaryTargets for Vercel Linux + local
  if (!schemaContent.includes('binaryTargets')) {
    schemaContent = schemaContent.replace(
      /generator\s+client\s*\{/,
      `generator client {\n  binaryTargets = ["native", "rhel-openssl-3.0.x", "debian-openssl-3.0.x"]`
    );
  }

  fs.writeFileSync(schemaPath, schemaContent, 'utf8');
  console.log(`✅ [Prisma Config] schema.prisma written with provider: ${isPostgres ? 'postgresql' : 'sqlite'}`);

  // Generate Prisma client with correct binaries
  try {
    console.log('⚙️ [Prisma Config] Running prisma generate...');
    execSync('npx prisma generate', {
      stdio: 'inherit',
      env: process.env,
    });
    console.log('✅ [Prisma Config] Prisma Client successfully generated.');
  } catch (err) {
    console.error('❌ [Prisma Config] prisma generate warning/error:', err.message);
  }
}

function updateEnvFile(vars) {
  try {
    const envPath = path.join(process.cwd(), '.env');
    let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

    for (const [key, value] of Object.entries(vars)) {
      if (!value) continue;
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, `${key}="${value}"`);
      } else {
        envContent += `\n${key}="${value}"\n`;
      }
    }

    fs.writeFileSync(envPath, envContent, 'utf8');
  } catch (e) {
    // Non-fatal if .env cannot be written
  }
}

if (require.main === module) {
  detectAndConfigureDatabase();
}

module.exports = { detectAndConfigureDatabase };

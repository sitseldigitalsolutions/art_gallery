import { execSync } from 'node:child_process';
import fs from 'node:fs';
import { PrismaClient } from '@prisma/client';

/**
 * Prepares the isolated test database once per run: applies migrations, then empties every table.
 * Guarded so it can only ever touch a database whose name ends in "_test".
 */
export default async function setup() {
  const url = process.env.TEST_DATABASE_URL ?? 'mysql://root:password@localhost:3306/art_gallery_test';
  const dbName = new URL(url).pathname.replace('/', '');
  if (!dbName.endsWith('_test')) throw new Error(`Refusing to run tests against non-test database "${dbName}"`);

  execSync('npx prisma migrate deploy', { stdio: 'pipe', env: { ...process.env, DATABASE_URL: url } });

  const prisma = new PrismaClient({ datasourceUrl: `${url}?connection_limit=1` }); // single connection: FK checks are per-session
  const tables = await prisma.$queryRaw<Array<{ TABLE_NAME: string }>>`
    SELECT TABLE_NAME FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = ${dbName} AND TABLE_NAME <> '_prisma_migrations'`;
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0');
  for (const { TABLE_NAME } of tables) await prisma.$executeRawUnsafe(`TRUNCATE TABLE \`${TABLE_NAME}\``);
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1');
  await prisma.$disconnect();

  return () => fs.rmSync(process.env.TEST_UPLOAD_DIR ?? 'uploads-test', { recursive: true, force: true });
}

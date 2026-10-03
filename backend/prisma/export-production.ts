/**
 * Build importable SQL files for a hosted MySQL/MariaDB (e.g. Hostinger phpMyAdmin) from the local dev database.
 *
 *   npx tsx prisma/export-production.ts
 *
 * Output (repo root /database):
 *   art_gallery_full.sql    – all tables + demo data, ready to import into an EMPTY database
 *   art_gallery_schema.sql  – tables only (no data)
 *   production-credentials.local.txt – new random passwords for every account (git-ignored, never commit)
 *
 * The source database is never modified: data is copied into a temporary database first, then
 * passwords are replaced with fresh random ones (the demo passwords are public in the README),
 * login sessions and the dev audit log are cleared, and image URLs are rewritten to the public URL.
 */
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const CONTAINER = process.env.MYSQL_CONTAINER ?? 'art-gallery-mysql';
const ROOT_PASSWORD = process.env.MYSQL_ROOT_PASSWORD ?? 'password';
const SOURCE_DB = 'art_gallery';
const EXPORT_DB = 'art_gallery_export_tmp';
const LOCAL_URL = 'http://localhost:4000';
const PUBLIC_URL = (process.env.EXPORT_PUBLIC_URL ?? 'https://artgalleryapi.mymoonsgallery.com').replace(/\/$/, '');
const ADMIN_EMAIL = process.env.EXPORT_ADMIN_EMAIL ?? 'admin@mymoonsgallery.com';
const OUT_DIR = path.resolve('..', 'database');

const mysql = (args: string[], input?: string) =>
  execFileSync('docker', ['exec', '-i', CONTAINER, 'mysql', '-uroot', `-p${ROOT_PASSWORD}`, '--default-character-set=utf8mb4', ...args], {
    input,
    maxBuffer: 1024 * 1024 * 512,
    stdio: ['pipe', 'pipe', 'ignore'],
  }).toString();

const dump = (db: string, extra: string[]) =>
  execFileSync(
    'docker',
    [
      'exec',
      CONTAINER,
      'mysqldump',
      '-uroot',
      `-p${ROOT_PASSWORD}`,
      '--default-character-set=utf8mb4',
      '--single-transaction',
      '--no-tablespaces',
      '--skip-add-locks', // shared hosting users often lack LOCK TABLES
      '--set-gtid-purged=OFF',
      '--skip-triggers',
      ...extra,
      db,
    ],
    { maxBuffer: 1024 * 1024 * 512, stdio: ['ignore', 'pipe', 'ignore'] },
  ).toString();

/** Strong password that satisfies the app's rules. */
function password() {
  const sets = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnpqrstuvwxyz', '23456789', '!@#%&*?'];
  const all = sets.join('');
  const pick = (s: string) => s[crypto.randomInt(s.length)];
  const chars = sets.map(pick);
  while (chars.length < 16) chars.push(pick(all));
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

const header = (title: string) => `-- ${title}
-- Generated ${new Date().toISOString()} from the local development database.
-- Import into an EMPTY database (phpMyAdmin → select database → Import). Compatible with MySQL 8 and MariaDB 10.5+.
-- Image URLs point to ${PUBLIC_URL}/media/... — upload backend/uploads to the server so they resolve.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';

`;

const footer = '\nSET FOREIGN_KEY_CHECKS = 1;\n';

/** Remove statements phpMyAdmin/MariaDB on shared hosting may reject and normalise collation. */
function clean(sql: string) {
  return sql
    .replace(/^\/\*!40101 SET @OLD_[^\n]*\n/gm, '')
    .replace(/^\/\*!40\d{3} SET [A-Z_]+=@OLD_[^\n]*\n/gm, '')
    .replace(/^\/\*!50503 SET NAMES[^\n]*\n/gm, '')
    .replace(/^\/\*!40103 SET TIME_ZONE[^\n]*\n/gm, '')
    .replace(/^\/\*!40\d{3} SET (UNIQUE_CHECKS|FOREIGN_KEY_CHECKS|SQL_MODE|SQL_NOTES|CHARACTER_SET_CLIENT)[^\n]*\n/gm, '')
    .replace(/^-- MySQL dump[^\n]*\n|^-- Host:[^\n]*\n|^-- Server version[^\n]*\n|^-- Dump completed[^\n]*\n/gm, '')
    .replace(/utf8mb4_0900_ai_ci/g, 'utf8mb4_unicode_ci');
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // 1. Copy the dev database into a throwaway database.
  mysql(['-e', `DROP DATABASE IF EXISTS \`${EXPORT_DB}\`; CREATE DATABASE \`${EXPORT_DB}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`]);
  mysql([EXPORT_DB], dump(SOURCE_DB, []));

  // 2. Sanitise the copy.
  const prisma = new PrismaClient({ datasourceUrl: `mysql://root:${ROOT_PASSWORD}@localhost:3306/${EXPORT_DB}` });
  const users = await prisma.user.findMany({ select: { id: true, email: true, roles: { select: { role: { select: { name: true } } } } } });
  const credentials: string[] = [];
  for (const u of users) {
    const isAdmin = u.roles.some((r) => r.role.name === 'ADMIN');
    const email = isAdmin && u.email === 'admin@artgallery.local' ? ADMIN_EMAIL : u.email;
    const pw = password();
    await prisma.user.update({ where: { id: u.id }, data: { email, passwordHash: await bcrypt.hash(pw, 12), failedLogins: 0, lockedUntil: null } });
    credentials.push(`${u.roles.map((r) => r.role.name).join('+').padEnd(16)} ${email.padEnd(40)} ${pw}`);
  }
  await prisma.session.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.downloadLog.deleteMany();
  await prisma.$disconnect();

  // 3. Export.
  const rewrite = (sql: string) => sql.split(LOCAL_URL).join(PUBLIC_URL);
  const full = clean(rewrite(dump(EXPORT_DB, ['--complete-insert'])));
  const schema = clean(dump(EXPORT_DB, ['--no-data']));
  if (/localhost:4000/.test(full)) throw new Error('A localhost URL survived the rewrite');

  fs.writeFileSync(path.join(OUT_DIR, 'art_gallery_full.sql'), header('MyMoons Art Gallery — full database (tables + demo data)') + full + footer);
  fs.writeFileSync(path.join(OUT_DIR, 'art_gallery_schema.sql'), header('MyMoons Art Gallery — tables only (no data)') + schema + footer);
  fs.writeFileSync(
    // Never overwrite an earlier passwords file: it may match a database that is already live.
    path.join(OUT_DIR, fs.existsSync(path.join(OUT_DIR, 'production-credentials.local.txt')) ? `production-credentials-${Date.now()}.local.txt` : 'production-credentials.local.txt'),
    `Sign-in details for the accounts inside database/art_gallery_full.sql\nGenerated ${new Date().toISOString()} — KEEP PRIVATE, do not commit, change after first login.\n\n${credentials.join('\n')}\n`,
  );

  mysql(['-e', `DROP DATABASE IF EXISTS \`${EXPORT_DB}\`;`]);

  const tables = (schema.match(/CREATE TABLE/g) ?? []).length;
  const inserts = (full.match(/^INSERT INTO/gm) ?? []).length;
  console.log(`✓ ${tables} tables, ${inserts} INSERT statements, ${users.length} accounts with new passwords`);
  console.log(`  ${path.join(OUT_DIR, 'art_gallery_full.sql')} (${(Buffer.byteLength(full) / 1024).toFixed(0)} KB)`);
  console.log(`  ${path.join(OUT_DIR, 'art_gallery_schema.sql')} (${(Buffer.byteLength(schema) / 1024).toFixed(0)} KB)`);
}

main().catch((err) => {
  console.error(err);
  try {
    mysql(['-e', `DROP DATABASE IF EXISTS \`${EXPORT_DB}\`;`]);
  } catch {
    /* ignore */
  }
  process.exit(1);
});

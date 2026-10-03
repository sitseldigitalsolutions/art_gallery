import { config } from '../config/env.js';
import { prisma } from './prisma/client.js';

/**
 * Database adapter selection. MySQL + Prisma is the implemented, supported adapter.
 * The other combinations are reserved by configuration and fail fast with a clear message
 * instead of silently mixing stores for the same business entities.
 */
export async function connectDatabase() {
  const combo = `${config.DATABASE_TYPE}/${config.ORM_PROVIDER}`;
  if (combo !== 'mysql/prisma') {
    throw new Error(
      `DATABASE_TYPE/ORM_PROVIDER "${combo}" is not implemented yet. Supported: mysql/prisma. ` +
        'See docs/ARCHITECTURE.md → "Database adapters" for how to add one.',
    );
  }
  await prisma.$connect();
  return prisma;
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
}

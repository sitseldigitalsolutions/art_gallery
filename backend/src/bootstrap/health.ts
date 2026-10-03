import { config } from '../config/env.js';
import { prisma } from '../database/prisma/client.js';

export async function healthReport() {
  let database: 'up' | 'down' = 'up';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    database = 'down';
  }
  return {
    status: database === 'up' ? ('ok' as const) : ('degraded' as const),
    uptimeSeconds: Math.round(process.uptime()),
    framework: config.BACKEND_FRAMEWORK,
    database: { type: config.DATABASE_TYPE, orm: config.ORM_PROVIDER, status: database },
    storage: config.STORAGE_PROVIDER,
    payments: config.PAYMENT_PROVIDER,
    ai: config.AI_PROVIDER,
    timestamp: new Date().toISOString(),
  };
}

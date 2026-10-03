import type { Prisma } from '@prisma/client';
import { prisma } from '../database/prisma/client.js';
import { logger } from '../utils/logger.js';
import type { AuthUser } from './http.js';

type Tx = Prisma.TransactionClient | typeof prisma;

export async function audit(
  actor: AuthUser | null,
  action: string,
  entityType: string,
  entityId: string | null,
  metadata?: Prisma.InputJsonValue,
  opts: { ip?: string; tx?: Tx } = {},
) {
  try {
    await (opts.tx ?? prisma).auditLog.create({
      data: {
        actorId: actor?.id ?? null,
        actorRole: actor?.roles.join(',') ?? 'SYSTEM',
        action,
        entityType,
        entityId,
        metadata,
        ipAddress: opts.ip,
      },
    });
  } catch (err) {
    // Audit failures must never be silent, but should not break a committed business action.
    logger.error({ err, action, entityType, entityId }, 'Failed to write audit log');
    if (opts.tx) throw err;
  }
}

export async function notify(
  userId: string,
  type: string,
  title: string,
  body?: string,
  link?: string,
  tx: Tx = prisma,
) {
  await tx.notification.create({ data: { userId, type, title, body, link } });
}

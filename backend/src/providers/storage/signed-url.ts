import crypto from 'node:crypto';
import { config } from '../../config/env.js';

/**
 * Short-lived HMAC signed URLs for private files. The signature binds the storage key,
 * the user it was issued to, and the expiry: a leaked URL stops working after ttlSeconds
 * and cannot be re-targeted to another file.
 */
const sign = (payload: string) =>
  crypto.createHmac('sha256', config.FILE_SIGNING_SECRET).update(payload).digest('base64url');

export function createSignedFileUrl(key: string, userId: string, ttlSeconds = 600): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const k = Buffer.from(key).toString('base64url');
  const sig = sign(`${k}.${userId}.${exp}`);
  return `${config.API_PUBLIC_URL}/api/v1/files/private?k=${k}&u=${encodeURIComponent(userId)}&exp=${exp}&sig=${sig}`;
}

export function verifySignedFileParams(params: Record<string, unknown>): string | null {
  const { k, u, exp, sig } = params;
  if (typeof k !== 'string' || typeof u !== 'string' || typeof exp !== 'string' || typeof sig !== 'string') return null;
  const expNum = Number(exp);
  if (!Number.isFinite(expNum) || expNum < Math.floor(Date.now() / 1000)) return null;
  const expected = Buffer.from(sign(`${k}.${u}.${exp}`));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return null;
  return Buffer.from(k, 'base64url').toString('utf8');
}

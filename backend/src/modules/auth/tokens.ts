import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { config } from '../../config/env.js';

export const REFRESH_COOKIE = 'ag_rt';

export function signAccessToken(userId: string): string {
  return jwt.sign({ typ: 'access' }, config.JWT_ACCESS_SECRET, {
    subject: userId,
    expiresIn: config.JWT_ACCESS_TTL as jwt.SignOptions['expiresIn'],
    issuer: 'art-gallery-api',
    audience: 'art-gallery-web',
  });
}

export function verifyAccessToken(token: string): string | null {
  try {
    const payload = jwt.verify(token, config.JWT_ACCESS_SECRET, {
      issuer: 'art-gallery-api',
      audience: 'art-gallery-web',
      algorithms: ['HS256'],
    }) as jwt.JwtPayload;
    if (payload.typ !== 'access' || typeof payload.sub !== 'string') return null;
    return payload.sub;
  } catch {
    return null;
  }
}

/** Refresh tokens are opaque random values; only an HMAC hash is stored in the DB. */
export function generateRefreshToken() {
  const token = crypto.randomBytes(48).toString('base64url');
  return { token, hash: hashRefreshToken(token) };
}

export function hashRefreshToken(token: string) {
  return crypto.createHmac('sha256', config.JWT_REFRESH_SECRET).update(token).digest('hex');
}

export const refreshTtlMs = () => config.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;

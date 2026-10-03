import type { Readable } from 'node:stream';
import type { RoleName } from '@prisma/client';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  roles: RoleName[];
  /** Present when the user owns an artist account. Always derived server-side. */
  artistId: string | null;
  artistStatus: string | null;
}

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface RequestContext {
  params: Record<string, string>;
  query: Record<string, unknown>;
  body: unknown;
  user: AuthUser | null;
  files: UploadedFile[];
  cookies: Record<string, string>;
  headers: Record<string, string | undefined>;
  ip: string;
  userAgent?: string;
}

export interface CookieInstruction {
  name: string;
  value: string;
  maxAgeMs?: number;
  path?: string;
  clear?: boolean;
}

export interface FileResponse {
  stream: Readable;
  contentType: string;
  filename?: string;
  disposition?: 'inline' | 'attachment';
  cacheSeconds?: number;
}

export interface HandlerResult {
  status?: number;
  data?: unknown;
  meta?: unknown;
  cookies?: CookieInstruction[];
  file?: FileResponse;
  raw?: { contentType: string; body: string; filename?: string };
}

export type RateLimitTier = 'default' | 'auth' | 'upload' | 'strict';

/** Framework-neutral route definition. Adapters (Express/Hapi) translate these. */
export interface RouteDef {
  method: HttpMethod;
  path: string; // e.g. /artworks/:id  (mounted under /api/v1)
  auth?: 'required' | 'optional' | 'none';
  roles?: RoleName[];
  upload?: { field: string; maxCount: number };
  rateLimit?: RateLimitTier;
  /** Require same-origin request (cookie-authenticated endpoints → CSRF defence). */
  sameOrigin?: boolean;
  handler: (ctx: RequestContext) => Promise<HandlerResult>;
}

export const ok = (data: unknown, meta?: unknown): HandlerResult => ({ status: 200, data, meta });
export const created = (data: unknown): HandlerResult => ({ status: 201, data });

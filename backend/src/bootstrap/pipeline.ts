import { Prisma } from '@prisma/client';
import { config } from '../config/env.js';
import { hasRole, resolveUser } from '../middleware/authenticate.js';
import { checkRateLimit } from '../middleware/rate-limit.js';
import { AppError, forbidden, unauthorized } from '../shared/errors.js';
import type { HandlerResult, RequestContext, RouteDef } from '../shared/http.js';
import { logger } from '../utils/logger.js';

/**
 * Framework-independent request pipeline shared by the Express and Hapi adapters:
 * rate limit → authenticate → authorize (RBAC) → CSRF origin check → handler.
 */
export async function executeRoute(route: RouteDef, ctx: RequestContext): Promise<HandlerResult> {
  checkRateLimit(route.rateLimit ?? 'default', ctx.ip, `${route.method} ${route.path}`);

  const authMode = route.auth ?? (route.roles ? 'required' : 'none');
  if (authMode !== 'none') {
    ctx.user = await resolveUser(ctx.headers['authorization']);
    if (authMode === 'required' && !ctx.user) throw unauthorized();
  }
  if (route.roles && !hasRole(ctx.user, route.roles)) throw forbidden();

  if (route.sameOrigin) assertSameOrigin(ctx);

  return route.handler(ctx);
}

/** Cookie-authenticated endpoints must come from our own frontend (CSRF defence in depth on top of SameSite). */
function assertSameOrigin(ctx: RequestContext) {
  const origin = ctx.headers['origin'] ?? ctx.headers['referer'];
  if (!origin) {
    if (config.isProd) throw forbidden('Missing request origin');
    return;
  }
  const allowed = allowedOrigins();
  if (!allowed.some((o) => origin === o || origin.startsWith(o + '/'))) throw forbidden('Cross-origin request rejected');
}

export const allowedOrigins = () => config.FRONTEND_URL.split(',').map((s) => s.trim().replace(/\/$/, ''));

export interface ErrorBody {
  status: number;
  body: { success: false; error: { code: string; message: string; details?: unknown } };
}

export function toErrorResponse(err: unknown): ErrorBody {
  if (err instanceof AppError) {
    return { status: err.status, body: { success: false, error: { code: err.code, message: err.message, details: err.details } } };
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return { status: 409, body: { success: false, error: { code: 'CONFLICT', message: 'A record with these details already exists' } } };
    }
    if (err.code === 'P2025') {
      return { status: 404, body: { success: false, error: { code: 'NOT_FOUND', message: 'Resource not found' } } };
    }
  }
  const e = err as { code?: string; message?: string };
  if (e?.code === 'LIMIT_FILE_SIZE') {
    return { status: 413, body: { success: false, error: { code: 'FILE_TOO_LARGE', message: `File exceeds ${config.MAX_UPLOAD_MB}MB limit` } } };
  }
  if (e?.code === 'LIMIT_UNEXPECTED_FILE' || e?.code === 'LIMIT_FILE_COUNT') {
    return { status: 400, body: { success: false, error: { code: 'BAD_UPLOAD', message: 'Unexpected or too many files' } } };
  }
  logger.error({ err }, 'Unhandled error');
  return {
    status: 500,
    body: { success: false, error: { code: 'INTERNAL', message: config.isProd ? 'Something went wrong' : String(e?.message ?? err) } },
  };
}

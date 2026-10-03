import Hapi from '@hapi/hapi';
import type { Readable } from 'node:stream';
import { config } from '../../config/env.js';
import { allowedOrigins, executeRoute, toErrorResponse } from '../../bootstrap/pipeline.js';
import { healthReport } from '../../bootstrap/health.js';
import { storage } from '../../providers/storage/index.js';
import type { HandlerResult, RequestContext, RouteDef, UploadedFile } from '../../shared/http.js';

/** Hapi adapter: same RouteDef table and pipeline as Express, so business logic is shared. */
export async function createHapiServer(routes: RouteDef[]) {
  const server = Hapi.server({
    port: config.PORT,
    routes: {
      cors: { origin: allowedOrigins(), credentials: true },
      security: { xframe: 'deny', noSniff: true, hsts: config.isProd, referrer: 'strict-origin-when-cross-origin' },
    },
  });

  server.state('ag_rt', {
    isHttpOnly: true,
    isSecure: config.isProd || config.COOKIE_SAMESITE === 'none',
    isSameSite: ({ lax: 'Lax', strict: 'Strict', none: 'None' } as const)[config.COOKIE_SAMESITE],
    path: '/api/v1/auth',
    encoding: 'none',
    strictHeader: true,
  });

  server.route({
    method: 'GET',
    path: '/health',
    handler: async (_req, h) => {
      const report = await healthReport();
      return h.response(report).code(report.status === 'ok' ? 200 : 503);
    },
  });

  server.route({
    method: 'GET',
    path: '/media/{key*}',
    handler: async (req, h) => {
      try {
        const file = await storage.getStream(String(req.params.key), 'public');
        return h.response(file.stream).type(file.contentType).header('Cache-Control', 'public, max-age=604800');
      } catch (err) {
        const { status, body } = toErrorResponse(err);
        return h.response(body).code(status);
      }
    },
  });

  for (const route of routes) {
    const hapiPath = '/api/v1' + route.path.replace(/:([A-Za-z0-9_]+)/g, '{$1}');
    server.route({
      method: route.method,
      path: hapiPath,
      options: route.upload
        ? { payload: { output: 'data', parse: true, multipart: { output: 'annotated' }, maxBytes: config.maxUploadBytes * route.upload.maxCount } }
        : route.method === 'GET' || route.method === 'DELETE'
          ? {}
          : { payload: { maxBytes: 1024 * 1024 } },
      handler: async (req, h) => {
        const { body, files } = splitMultipart(req.payload, route.upload?.field);
        const ctx: RequestContext = {
          params: req.params as Record<string, string>,
          query: req.query as Record<string, unknown>,
          body,
          user: null,
          files,
          cookies: (req.state ?? {}) as Record<string, string>,
          headers: req.headers as Record<string, string | undefined>,
          ip: req.info.remoteAddress,
          userAgent: req.headers['user-agent'] as string | undefined,
        };
        try {
          return send(h, await executeRoute(route, ctx));
        } catch (err) {
          const { status, body: errBody } = toErrorResponse(err);
          return h.response(errBody).code(status);
        }
      },
    });
  }

  return server;
}

interface Annotated {
  filename: string;
  headers: Record<string, string>;
  payload: Buffer;
}

function splitMultipart(payload: unknown, field?: string): { body: unknown; files: UploadedFile[] } {
  if (!field || !payload || typeof payload !== 'object') return { body: payload ?? {}, files: [] };
  const body: Record<string, unknown> = {};
  const files: UploadedFile[] = [];
  for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
    const values = Array.isArray(value) ? value : [value];
    if (key === field) {
      for (const v of values as Annotated[]) {
        if (v && typeof v === 'object' && 'payload' in v) {
          files.push({
            fieldname: key,
            originalname: v.filename,
            mimetype: v.headers['content-type'] ?? 'application/octet-stream',
            size: v.payload.length,
            buffer: v.payload,
          });
        }
      }
    } else {
      body[key] = value;
    }
  }
  return { body, files };
}

function send(h: Hapi.ResponseToolkit, result: HandlerResult) {
  for (const c of result.cookies ?? []) {
    if (c.clear) h.unstate(c.name);
    else h.state(c.name, c.value, { ttl: c.maxAgeMs });
  }
  if (result.file) {
    const r = h
      .response(result.file.stream as Readable)
      .type(result.file.contentType)
      .header('Cache-Control', 'private, no-store');
    if (result.file.filename) r.header('Content-Disposition', `attachment; filename="${result.file.filename}"`);
    return r;
  }
  if (result.raw) {
    const r = h.response(result.raw.body).type(result.raw.contentType);
    if (result.raw.filename) r.header('Content-Disposition', `attachment; filename="${result.raw.filename}"`);
    return r;
  }
  if (result.status === 204) return h.response().code(204);
  return h
    .response({ success: true, data: result.data ?? null, ...(result.meta ? { meta: result.meta } : {}) })
    .code(result.status ?? 200);
}

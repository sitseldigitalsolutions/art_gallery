import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import multer from 'multer';
import path from 'node:path';
import { config } from '../../config/env.js';
import { allowedOrigins, executeRoute, toErrorResponse } from '../../bootstrap/pipeline.js';
import type { HandlerResult, RequestContext, RouteDef } from '../../shared/http.js';
import { healthReport } from '../../bootstrap/health.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxUploadBytes, files: 10, fields: 60 },
});

export function createExpressApp(routes: RouteDef[]) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // public artwork images are embedded by the web app
      contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], imgSrc: ["'self'"], frameAncestors: ["'none'"] } },
    }),
  );
  app.use(cors({ origin: allowedOrigins(), credentials: true, maxAge: 600 }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));
  app.use(cookieParser());

  // Public media only. Private files (custom-art sources, digital deliverables) live in a sibling
  // directory that is never mounted and are streamed through authorized endpoints.
  if (config.STORAGE_PROVIDER === 'local') {
    app.use(
      '/media',
      express.static(path.resolve(config.LOCAL_UPLOAD_DIR, 'public'), {
        dotfiles: 'deny',
        index: false,
        maxAge: '7d',
        setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff'),
      }),
    );
  }

  app.get('/health', async (_req, res) => {
    const report = await healthReport();
    res.status(report.status === 'ok' ? 200 : 503).json(report);
  });

  const router = express.Router();
  for (const route of routes) {
    const handlers: Array<(req: Request, res: Response, next: NextFunction) => void> = [];
    if (route.upload) handlers.push(upload.array(route.upload.field, route.upload.maxCount));
    handlers.push((req, res, next) => {
      const ctx: RequestContext = {
        params: req.params as Record<string, string>,
        query: req.query as Record<string, unknown>,
        body: req.body ?? {},
        user: null,
        files: ((req.files as Express.Multer.File[]) ?? []).map((f) => ({
          fieldname: f.fieldname,
          originalname: f.originalname,
          mimetype: f.mimetype,
          size: f.size,
          buffer: f.buffer,
        })),
        cookies: (req.cookies ?? {}) as Record<string, string>,
        headers: req.headers as Record<string, string | undefined>,
        ip: req.ip ?? 'unknown',
        userAgent: req.get('user-agent'),
      };
      executeRoute(route, ctx)
        .then((result) => send(res, result))
        .catch(next);
    });
    router[route.method.toLowerCase() as 'get'](route.path, ...handlers);
  }
  app.use('/api/v1', router);

  app.use((_req, res) => {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } });
  });
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const { status, body } = toErrorResponse(err);
    res.status(status).json(body);
  });

  return app;
}

function send(res: Response, result: HandlerResult) {
  for (const c of result.cookies ?? []) {
    const opts = {
      httpOnly: true,
      // SameSite=None (cross-site frontend) is only valid on secure cookies.
      secure: config.isProd || config.COOKIE_SAMESITE === 'none',
      sameSite: config.COOKIE_SAMESITE,
      path: c.path ?? '/api/v1/auth',
    };
    if (c.clear) res.clearCookie(c.name, opts);
    else res.cookie(c.name, c.value, { ...opts, maxAge: c.maxAgeMs });
  }
  if (result.file) {
    const f = result.file;
    res.setHeader('Content-Type', f.contentType);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', f.cacheSeconds ? `private, max-age=${f.cacheSeconds}` : 'private, no-store');
    if (f.filename) res.attachment(f.filename);
    if (f.disposition === 'inline') res.setHeader('Content-Disposition', 'inline');
    f.stream.on('error', () => res.destroy());
    f.stream.pipe(res);
    return;
  }
  if (result.raw) {
    res.setHeader('Content-Type', result.raw.contentType);
    if (result.raw.filename) res.attachment(result.raw.filename);
    res.status(result.status ?? 200).send(result.raw.body);
    return;
  }
  if (result.status === 204) {
    res.status(204).end();
    return;
  }
  res.status(result.status ?? 200).json({ success: true, data: result.data ?? null, ...(result.meta ? { meta: result.meta } : {}) });
}

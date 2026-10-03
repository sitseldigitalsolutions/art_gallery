import path from 'node:path';
import { storage } from '../../providers/storage/index.js';
import { verifySignedFileParams } from '../../providers/storage/signed-url.js';
import { AppError } from '../../shared/errors.js';
import type { RouteDef } from '../../shared/http.js';

/**
 * Streams a PRIVATE file (custom-art photos, digital deliverables) for a valid, unexpired
 * HMAC signature. The signature itself is the authorization; it is minted only by endpoints
 * that have already checked the caller may see the file.
 */
export const fileRoutes: RouteDef[] = [
  {
    method: 'GET',
    path: '/files/private',
    rateLimit: 'default',
    handler: async (ctx) => {
      const key = verifySignedFileParams(ctx.query);
      if (!key) throw new AppError(403, 'INVALID_SIGNATURE', 'This link is invalid or has expired');
      const file = await storage.getStream(key, 'private');
      return {
        file: {
          stream: file.stream,
          contentType: file.contentType,
          disposition: ctx.query.download === '1' ? 'attachment' : 'inline',
          filename: ctx.query.download === '1' ? path.basename(key) : undefined,
          cacheSeconds: 300,
        },
      };
    },
  },
];

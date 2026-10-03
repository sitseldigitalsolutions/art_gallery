import type { RouteDef } from '../shared/http.js';
import { artistRoutes } from './artists/artists.routes.js';
import { artworkRoutes } from './artworks/artworks.routes.js';
import { collectionRoutes } from './collections/collections.routes.js';
import { fileRoutes } from './files/files.routes.js';
import { followRoutes } from './follows/follows.routes.js';
import { galleryRoutes } from './galleries/galleries.routes.js';
import { homeRoutes } from './home/home.routes.js';
import { notificationRoutes } from './notifications/notifications.routes.js';
import { reportRoutes } from './reports/reports.routes.js';
import { reviewRoutes } from './reviews/reviews.routes.js';
import { taxonomyRoutes } from './taxonomy/taxonomy.routes.js';
import { userRoutes } from './users/users.routes.js';
import { wishlistRoutes } from './wishlist/wishlist.routes.js';

/**
 * Orders routes so static segments win over params for the same method and depth
 * (e.g. GET /artists/me before GET /artists/:slug). Express matches in registration order.
 */
export function sortBySpecificity(routes: RouteDef[]): RouteDef[] {
  const segs = (p: string) => p.split('/').filter(Boolean);
  const rank = (r: RouteDef) => segs(r.path).map((s) => (s.startsWith(':') ? 1 : 0));
  return routes
    .map((r, i) => ({ r, i }))
    .sort((a, b) => {
      // Consistent total order: method, depth, then static-before-param per segment.
      if (a.r.method !== b.r.method) return a.r.method < b.r.method ? -1 : 1;
      const ra = rank(a.r);
      const rb = rank(b.r);
      if (ra.length !== rb.length) return ra.length - rb.length;
      for (let k = 0; k < ra.length; k++) if (ra[k] !== rb[k]) return ra[k] - rb[k];
      return a.i - b.i;
    })
    .map((x) => x.r);
}

/** Catalog & community modules (owned by workstream A). */
export const catalogRoutes: RouteDef[] = sortBySpecificity([
  ...taxonomyRoutes,
  ...artworkRoutes,
  ...artistRoutes,
  ...galleryRoutes,
  ...collectionRoutes,
  ...homeRoutes,
  ...wishlistRoutes,
  ...followRoutes,
  ...reviewRoutes,
  ...userRoutes,
  ...notificationRoutes,
  ...fileRoutes,
  ...reportRoutes,
]);

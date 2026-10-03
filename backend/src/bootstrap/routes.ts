import type { RouteDef } from '../shared/http.js';
import { authRoutes } from '../modules/auth/auth.routes.js';
import { catalogRoutes } from '../modules/catalog.routes.js';
import { commerceRoutes } from '../modules/commerce.routes.js';
import { siteConfigRoutes } from '../modules/site-config/site-config.routes.js';

/** Single route table consumed by whichever framework adapter is configured. */
export function allRoutes(): RouteDef[] {
  return [...authRoutes, ...catalogRoutes, ...commerceRoutes, ...siteConfigRoutes];
}

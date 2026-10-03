import type { RouteDef } from '../shared/http.js';
import { adminRoutes } from './admin/admin.routes.js';
import { adminUserRoutes } from './admin/admin-users.routes.js';
import { analyticsRoutes } from './analytics/analytics.routes.js';
import { cartRoutes } from './cart/cart.routes.js';
import { customArtRoutes } from './custom-art/custom-art.routes.js';
import { downloadRoutes } from './downloads/downloads.routes.js';
import { financeRoutes } from './finance/finance.routes.js';
import { orderRoutes } from './orders/orders.routes.js';
import { paymentRoutes } from './payments/payments.routes.js';

/** Custom-art, commerce, finance, admin & analytics modules (owned by workstream B). */
export const commerceRoutes: RouteDef[] = [
  ...customArtRoutes,
  ...cartRoutes,
  ...orderRoutes,
  ...paymentRoutes,
  ...downloadRoutes,
  ...financeRoutes,
  ...adminRoutes,
  ...adminUserRoutes,
  ...analyticsRoutes,
];

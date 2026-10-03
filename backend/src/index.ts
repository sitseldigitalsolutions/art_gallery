import { config } from './config/env.js';
import { createExpressApp } from './adapters/express/app.js';
import { createHapiServer } from './adapters/hapi/server.js';
import { allRoutes } from './bootstrap/routes.js';
import { connectDatabase, disconnectDatabase } from './database/index.js';
import { logger } from './utils/logger.js';

async function main() {
  await connectDatabase();
  const routes = allRoutes();

  let close: () => Promise<void>;
  if (config.BACKEND_FRAMEWORK === 'hapi') {
    const server = await createHapiServer(routes);
    await server.start();
    close = () => server.stop({ timeout: 10_000 });
  } else {
    const app = createExpressApp(routes);
    const server = app.listen(config.PORT);
    close = () => new Promise((resolve) => server.close(() => resolve()));
  }
  logger.info(`🎨 Art Gallery API (${config.BACKEND_FRAMEWORK}) listening on :${config.PORT} — ${routes.length} routes`);

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down`);
    await close();
    await disconnectDatabase();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((err) => {
  logger.fatal({ err }, 'Failed to start API');
  process.exit(1);
});

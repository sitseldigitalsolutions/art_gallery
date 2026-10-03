import { defineConfig, devices } from '@playwright/test';

/**
 * Browser E2E against the real API + seeded dev database.
 * Prereqs: `docker compose up -d mysql`, `cd backend && npx prisma migrate deploy && npm run seed`.
 * The web servers are started automatically (or reused if already running).
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    ...devices['Desktop Chrome'],
  },
  webServer: [
    { command: 'npx tsx src/index.ts', cwd: '../backend', url: 'http://localhost:4000/health', reuseExistingServer: true, timeout: 60_000 },
    { command: 'npx vite --port 5173 --strictPort', url: 'http://localhost:5173', reuseExistingServer: true, timeout: 60_000 },
  ],
});

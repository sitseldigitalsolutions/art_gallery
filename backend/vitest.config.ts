import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    globalSetup: ['tests/global-setup.ts'],
    testTimeout: 30000,
    hookTimeout: 120000,
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? 'mysql://root:password@localhost:3306/art_gallery_test',
      LOCAL_UPLOAD_DIR: process.env.TEST_UPLOAD_DIR ?? 'uploads-test',
      API_PUBLIC_URL: 'http://localhost:4000',
      FRONTEND_URL: 'http://localhost:5173',
    },
  },
});

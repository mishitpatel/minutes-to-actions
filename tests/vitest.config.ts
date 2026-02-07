import { defineConfig } from 'vitest/config';
import path from 'path';
import dotenv from 'dotenv';

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Override DATABASE_URL with test database so tests don't wipe dev data
const testDbUrl =
  process.env.DATABASE_URL_TEST ||
  process.env.DATABASE_URL?.replace(
    '/minutes_to_actions?',
    '/minutes_to_actions_test?'
  );
if (testDbUrl) {
  process.env.DATABASE_URL = testDbUrl;
}

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    root: __dirname,
    include: ['api/**/*.test.ts'],
    fileParallelism: false, // Run test files sequentially to avoid DB conflicts
    testTimeout: 30000, // 30 seconds for API E2E tests
    hookTimeout: 30000,
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    alias: {
      '@api': path.resolve(__dirname, '../apps/api/src'),
      '@': path.resolve(__dirname, '../apps/api/src'),
    },
  },
});

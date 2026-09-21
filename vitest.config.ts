import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 20000,
    hookTimeout: 20000,
  },
  resolve: {
    alias: {
      '@super-optical/types': path.resolve(__dirname, 'packages/types/src/index.ts'),
      '@super-optical/validation': path.resolve(__dirname, 'packages/validation/src/index.ts'),
      '@super-optical/api': path.resolve(__dirname, 'backend/api/src/index.ts'),
    },
  },
});

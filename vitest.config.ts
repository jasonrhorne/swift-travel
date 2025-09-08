import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@swift-travel/shared': resolve(__dirname, './packages/shared/src'),
      '@swift-travel/database': resolve(__dirname, './packages/database/src'),
      '@swift-travel/agents': resolve(__dirname, './packages/agents/src'),
    },
  },
});
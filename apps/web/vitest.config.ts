import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@swift-travel/shared': resolve(__dirname, '../../packages/shared/src'),
      '@swift-travel/database': resolve(__dirname, '../../packages/database/src'),
      '@swift-travel/agents': resolve(__dirname, '../../packages/agents/src'),
    },
  },
});
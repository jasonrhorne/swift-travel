import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    env: {
      NODE_ENV: 'development',
      SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_ANON_KEY: 'test-key',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
      UPSTASH_REDIS_URL: 'https://test-redis.upstash.io',
      UPSTASH_REDIS_TOKEN: 'test-redis-token',
      OPENAI_API_KEY: 'test-openai-key',
      GOOGLE_PLACES_API_KEY: 'test-places-key',
      GOOGLE_MAPS_API_KEY: 'test-maps-key',
      INTERNAL_API_KEY: 'test-internal-key',
      TAVILY_API_KEY: 'test-tavily-key',
      JWT_SECRET: 'test-jwt-secret',
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@swift-travel/shared': resolve(__dirname, '../../packages/shared/src'),
      '@swift-travel/database': resolve(
        __dirname,
        '../../packages/database/src'
      ),
      '@swift-travel/agents': resolve(__dirname, '../../packages/agents/src'),
    },
  },
});

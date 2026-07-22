import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'src/__tests__/auth/**/*.test.ts',
      'src/__tests__/itineraries/**/*.test.ts',
      'src/__tests__/agents/contracts.test.ts',
      'src/__tests__/agents/food-agent.test.ts',
      'src/__tests__/agents/orchestrator.test.ts',
      'src/__tests__/integration/vertical-slice.test.ts',
    ],
    env: {
      SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_ANON_KEY: 'test-key',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
      OPENAI_API_KEY: 'test-openai-key',
      REDIS_URL: 'https://test-redis.upstash.io',
      REDIS_TOKEN: 'test-redis-token',
      UPSTASH_REDIS_URL: 'https://test-redis.upstash.io',
      UPSTASH_REDIS_TOKEN: 'test-redis-token',
      GOOGLE_PLACES_API_KEY: 'test-places-key',
      GOOGLE_MAPS_API_KEY: 'test-maps-key',
      INTERNAL_API_KEY: 'test-internal-key',
      TAVILY_API_KEY: 'test-tavily-key',
      JWT_SECRET: 'test-jwt-secret',
    },
  },
  resolve: {
    alias: {
      '@swift-travel/shared': resolve(__dirname, '../../packages/shared/src'),
      '@swift-travel/database': resolve(
        __dirname,
        '../../packages/database/src'
      ),
      '@swift-travel/agents': resolve(__dirname, '../../packages/agents/src'),
    },
  },
});

// Auth configuration for Swift Travel
// Based on architecture requirements and security standards

interface AuthConfig {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  upstashRedisUrl: string;
  upstashRedisToken: string;
  jwtSecret: string;
  tokenExpirationMinutes: number;
  sessionExpirationHours: number;
  rateLimitPerWindow: number;
  rateLimitWindowMinutes: number;
}

function getEnvVar(key: string, required: boolean = true): string {
  const value = process.env[key];
  
  // In development mode, provide default values for missing env vars
  if (process.env.NODE_ENV === 'development' && !value) {
    const devDefaults: Record<string, string> = {
      SUPABASE_URL: 'https://dummy-project.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'dummy-service-role-key',
      UPSTASH_REDIS_URL: 'https://dummy-redis.upstash.io',
      UPSTASH_REDIS_TOKEN: 'dummy-redis-token',
      JWT_SECRET: 'development-jwt-secret',
    };
    
    if (devDefaults[key]) {
      return devDefaults[key];
    }
  }
  
  if (required && !value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || '';
}

export const authConfig: AuthConfig = {
  supabaseUrl: getEnvVar('SUPABASE_URL'),
  supabaseServiceRoleKey: getEnvVar('SUPABASE_SERVICE_ROLE_KEY'),
  upstashRedisUrl: getEnvVar('UPSTASH_REDIS_URL'),
  upstashRedisToken: getEnvVar('UPSTASH_REDIS_TOKEN'),
  jwtSecret: getEnvVar('JWT_SECRET'),
  tokenExpirationMinutes: 15, // Magic link token expiration
  sessionExpirationHours: 24, // JWT session token expiration
  rateLimitPerWindow: 5, // Maximum 5 magic link requests
  rateLimitWindowMinutes: 15, // Per 15-minute window
};
// Environment variable validation
import { z } from 'zod';

// Environment schemas
export const DatabaseConfigSchema = z.object({
  url: z.string().url('Invalid database URL'),
  serviceRoleKey: z.string().min(1, 'Database service role key is required'),
  anonKey: z.string().min(1, 'Database anon key is required'),
});

export const RedisConfigSchema = z.object({
  url: z.string().url('Invalid Redis URL'),
  token: z.string().min(1, 'Redis token is required'),
});

export const ApiConfigSchema = z.object({
  openaiApiKey: z.string().regex(/^sk-/, 'Invalid OpenAI API key format'),
  googlePlacesApiKey: z.string().min(1, 'Google Places API key is required'),
  googleMapsApiKey: z.string().min(1, 'Google Maps API key is required'),
  internalApiKey: z.string().min(32, 'Internal API key must be at least 32 characters'),
});

export const FrontendConfigSchema = z.object({
  baseUrl: z.string().url('Invalid frontend base URL'),
  supabaseUrl: z.string().url('Invalid Supabase URL'),
  supabaseAnonKey: z.string().min(1, 'Supabase anon key is required'),
});

export const AppConfigSchema = z.object({
  environment: z.enum(['development', 'staging', 'production']),
  database: DatabaseConfigSchema,
  redis: RedisConfigSchema,
  api: ApiConfigSchema,
  frontend: FrontendConfigSchema,
});

// Validation functions
export function validateConfig(config: unknown) {
  try {
    const result = AppConfigSchema.parse(config);
    return { success: true, data: result, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return { 
        success: false, 
        data: null, 
        error: `Configuration validation failed:\n${errorMessages.join('\n')}` 
      };
    }
    return { 
      success: false, 
      data: null, 
      error: 'Unknown configuration validation error' 
    };
  }
}

// Environment-specific validation
export function validateDevelopmentEnv() {
  const required = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY', 
    'SUPABASE_ANON_KEY',
    'UPSTASH_REDIS_URL',
    'UPSTASH_REDIS_TOKEN',
    'OPENAI_API_KEY',
    'GOOGLE_PLACES_API_KEY',
    'GOOGLE_MAPS_API_KEY',
    'INTERNAL_API_KEY',
    'JWT_SECRET',
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  console.log('✅ Development environment validation passed');
}

export function validateProductionEnv() {
  validateDevelopmentEnv(); // Include all dev requirements
  
  const additionalRequired = [
    'SENTRY_DSN',
  ];
  
  const missing = additionalRequired.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn(`⚠️  Optional production environment variables missing: ${missing.join(', ')}`);
  }
  
  // Validate production-specific constraints
  if (process.env.NODE_ENV === 'production') {
    if (process.env.INTERNAL_API_KEY && process.env.INTERNAL_API_KEY.length < 64) {
      throw new Error('Internal API key must be at least 64 characters in production');
    }
    
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 64) {
      throw new Error('JWT secret must be at least 64 characters in production');
    }
  }
  
  console.log('✅ Production environment validation passed');
}

// Environment setup helpers
export function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value;
}

export function getOptionalEnv(key: string, defaultValue: string = ''): string {
  return process.env[key] || defaultValue;
}

export function getBooleanEnv(key: string, defaultValue: boolean = false): boolean {
  const value = process.env[key];
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
}

export function getNumberEnv(key: string, defaultValue: number = 0): number {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a valid number`);
  }
  return parsed;
}
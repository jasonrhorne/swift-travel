// Configuration management for all services
// Based on coding standards - never access process.env directly

interface DatabaseConfig {
  url: string;
  serviceRoleKey: string;
  anonKey: string;
}

interface RedisConfig {
  url: string;
  token: string;
}

interface ApiConfig {
  openaiApiKey: string;
  googlePlacesApiKey: string;
  googleMapsApiKey: string;
  internalApiKey: string;
}

interface AppConfig {
  environment: 'development' | 'staging' | 'production';
  database: DatabaseConfig;
  redis: RedisConfig;
  api: ApiConfig;
  frontend: {
    baseUrl: string;
    supabaseUrl: string;
    supabaseAnonKey: string;
  };
}

function getEnvVar(key: string, required: boolean = true): string {
  const value = process.env[key];
  if (required && !value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || '';
}

export const config: AppConfig = {
  environment: (getEnvVar('NODE_ENV', false) || 'development') as AppConfig['environment'],
  
  database: {
    url: getEnvVar('SUPABASE_URL'),
    serviceRoleKey: getEnvVar('SUPABASE_SERVICE_ROLE_KEY'),
    anonKey: getEnvVar('SUPABASE_ANON_KEY'),
  },
  
  redis: {
    url: getEnvVar('UPSTASH_REDIS_URL'),
    token: getEnvVar('UPSTASH_REDIS_TOKEN'),
  },
  
  api: {
    openaiApiKey: getEnvVar('OPENAI_API_KEY'),
    googlePlacesApiKey: getEnvVar('GOOGLE_PLACES_API_KEY'),
    googleMapsApiKey: getEnvVar('GOOGLE_MAPS_API_KEY'),
    internalApiKey: getEnvVar('INTERNAL_API_KEY'),
  },
  
  frontend: {
    baseUrl: getEnvVar('NEXT_PUBLIC_API_BASE_URL', false) || 'http://localhost:8888/.netlify/functions',
    supabaseUrl: getEnvVar('NEXT_PUBLIC_SUPABASE_URL', false) || getEnvVar('SUPABASE_URL'),
    supabaseAnonKey: getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY', false) || getEnvVar('SUPABASE_ANON_KEY'),
  },
};

// Validate configuration on startup
export function validateConfig() {
  const requiredKeys: (keyof AppConfig)[] = ['database', 'redis', 'api'];
  
  for (const key of requiredKeys) {
    if (!config[key]) {
      throw new Error(`Missing configuration section: ${key}`);
    }
  }
  
  console.log(`Configuration loaded for ${config.environment} environment`);
}
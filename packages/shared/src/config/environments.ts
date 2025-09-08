// Environment-specific configuration

export interface EnvironmentConfig {
  name: string;
  database: {
    poolSize: number;
    connectionTimeout: number;
  };
  redis: {
    maxRetries: number;
    retryDelay: number;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    structured: boolean;
  };
  performance: {
    functionTimeout: number;
    pipelineTimeout: number;
  };
  security: {
    rateLimiting: boolean;
    cors: {
      allowedOrigins: string[];
    };
  };
}

export const developmentConfig: EnvironmentConfig = {
  name: 'development',
  database: {
    poolSize: 10,
    connectionTimeout: 5000,
  },
  redis: {
    maxRetries: 3,
    retryDelay: 1000,
  },
  logging: {
    level: 'debug',
    structured: false,
  },
  performance: {
    functionTimeout: 30000, // 30 seconds
    pipelineTimeout: 300000, // 5 minutes
  },
  security: {
    rateLimiting: false,
    cors: {
      allowedOrigins: ['http://localhost:3000', 'http://localhost:8888'],
    },
  },
};

export const stagingConfig: EnvironmentConfig = {
  name: 'staging',
  database: {
    poolSize: 20,
    connectionTimeout: 10000,
  },
  redis: {
    maxRetries: 5,
    retryDelay: 2000,
  },
  logging: {
    level: 'info',
    structured: true,
  },
  performance: {
    functionTimeout: 20000, // 20 seconds
    pipelineTimeout: 120000, // 2 minutes
  },
  security: {
    rateLimiting: true,
    cors: {
      allowedOrigins: ['https://develop--swift-travel.netlify.app'],
    },
  },
};

export const productionConfig: EnvironmentConfig = {
  name: 'production',
  database: {
    poolSize: 50,
    connectionTimeout: 15000,
  },
  redis: {
    maxRetries: 5,
    retryDelay: 3000,
  },
  logging: {
    level: 'warn',
    structured: true,
  },
  performance: {
    functionTimeout: 10000, // 10 seconds
    pipelineTimeout: 60000, // 1 minute
  },
  security: {
    rateLimiting: true,
    cors: {
      allowedOrigins: ['https://swift-travel.com'],
    },
  },
};

export function getEnvironmentConfig(): EnvironmentConfig {
  const env = process.env.NODE_ENV || 'development';
  const environment = process.env.ENVIRONMENT;
  
  if (environment === 'staging') {
    return stagingConfig;
  }
  
  switch (env) {
    case 'production':
      return productionConfig;
    case 'development':
    default:
      return developmentConfig;
  }
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function isStaging(): boolean {
  return process.env.ENVIRONMENT === 'staging';
}

export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development' || 
         !process.env.NODE_ENV;
}
// Application constants
export const APP_NAME = 'Swift Travel';
export const APP_VERSION = '1.0.0';

// API Constants
export const API_ENDPOINTS = {
  AUTH: {
    MAGIC_LINK: '/auth/magic-link',
    VERIFY: '/auth/verify',
    LOGOUT: '/auth/logout',
  },
  ITINERARIES: {
    CREATE: '/itineraries/create',
    GET: '/itineraries',
    UPDATE: '/itineraries',
    DELETE: '/itineraries',
  },
  AGENTS: {
    RESEARCH: '/agents/research-agent',
    CURATION: '/agents/curation-agent',
    VALIDATION: '/agents/validation-agent',
    RESPONSE: '/agents/response-agent',
  },
} as const;

// Agent Processing Constants
export const AGENT_TIMEOUTS = {
  RESEARCH: 120000, // 2 minutes
  CURATION: 180000, // 3 minutes
  VALIDATION: 120000, // 2 minutes
  RESPONSE: 60000, // 1 minute
  TOTAL_PIPELINE: 600000, // 10 minutes
} as const;

// Cache TTL Constants (in seconds)
export const CACHE_TTL = {
  SESSION: 24 * 60 * 60, // 24 hours
  API_RESPONSE: 15 * 60, // 15 minutes
  AGENT_STATE: 60 * 60, // 1 hour
  GOOGLE_PLACES: 60 * 60 * 24, // 24 hours
} as const;

// Validation Constants
export const VALIDATION_RULES = {
  EMAIL: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 254,
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
  },
  NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 100,
  },
  DESCRIPTION: {
    MAX_LENGTH: 2000,
  },
} as const;

// Performance Constants
export const PERFORMANCE_TARGETS = {
  BUNDLE_SIZE: {
    INITIAL: 500 * 1024, // 500KB
    ROUTE: 100 * 1024, // 100KB
  },
  RESPONSE_TIME: {
    FUNCTION: 2000, // 2 seconds
    PIPELINE: 20000, // 20 seconds
  },
  COVERAGE_TARGET: 0.8, // 80%
} as const;
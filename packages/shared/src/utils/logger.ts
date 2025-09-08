// Structured logging with Pino
import pino from 'pino';
import { getEnvironmentConfig } from '../config/environments';

const envConfig = getEnvironmentConfig();

// Create logger instance
export const logger = pino({
  level: envConfig.logging.level,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  transport: envConfig.logging.structured ? undefined : {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname',
    },
  },
  base: {
    env: envConfig.name,
    service: 'swift-travel',
  },
});

// Agent-specific loggers
export const agentLogger = logger.child({ component: 'agent' });
export const apiLogger = logger.child({ component: 'api' });
export const dbLogger = logger.child({ component: 'database' });
export const cacheLogger = logger.child({ component: 'cache' });

// Logging utilities
export function logApiRequest(method: string, path: string, userId?: string) {
  apiLogger.info({
    method,
    path,
    userId,
    timestamp: new Date().toISOString(),
  }, 'API request');
}

export function logApiResponse(method: string, path: string, statusCode: number, duration: number, userId?: string) {
  apiLogger.info({
    method,
    path,
    statusCode,
    duration,
    userId,
    timestamp: new Date().toISOString(),
  }, 'API response');
}

export function logAgentStart(agentType: string, requestId: string) {
  agentLogger.info({
    agentType,
    requestId,
    timestamp: new Date().toISOString(),
  }, 'Agent processing started');
}

export function logAgentComplete(agentType: string, requestId: string, duration: number, success: boolean) {
  agentLogger.info({
    agentType,
    requestId,
    duration,
    success,
    timestamp: new Date().toISOString(),
  }, 'Agent processing completed');
}

export function logAgentError(agentType: string, requestId: string, error: Error) {
  agentLogger.error({
    agentType,
    requestId,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    timestamp: new Date().toISOString(),
  }, 'Agent processing error');
}

export function logDatabaseQuery(query: string, duration: number, success: boolean) {
  dbLogger.debug({
    query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
    duration,
    success,
    timestamp: new Date().toISOString(),
  }, 'Database query');
}

export function logCacheOperation(operation: 'get' | 'set' | 'del', key: string, hit?: boolean) {
  cacheLogger.debug({
    operation,
    key,
    hit,
    timestamp: new Date().toISOString(),
  }, 'Cache operation');
}
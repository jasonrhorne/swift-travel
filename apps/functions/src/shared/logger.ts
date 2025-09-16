// Structured logging for agent functions
// Based on coding standards - Pino with structured JSON logging

import pino from 'pino';
import { config } from '@swift-travel/shared/config';

// Create logger instance with proper configuration
export const logger = pino({
  name: 'swift-travel-agents',
  level: config.environment === 'development' ? 'debug' : 'info',
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    environment: config.environment,
    service: 'agent-orchestration',
  },
});

// Convenience methods for agent logging
export const agentLogger = {
  agentStart: (agent: string, requestId: string, data?: Record<string, any>) => {
    logger.info('Agent processing started', { agent, requestId, ...data });
  },
  
  agentComplete: (agent: string, requestId: string, duration: number, data?: Record<string, any>) => {
    logger.info('Agent processing completed', { agent, requestId, duration, ...data });
  },
  
  agentError: (agent: string, requestId: string, error: any, data?: Record<string, any>) => {
    logger.error('Agent processing failed', { agent, requestId, error: error.message, stack: error.stack, ...data });
  },
  
  orchestrationEvent: (event: string, requestId: string, data?: Record<string, any>) => {
    logger.info('Orchestration event', { event, requestId, ...data });
  },
  
  timeout: (requestId: string, elapsed: number, maxDuration: number) => {
    logger.warn('Processing timeout', { requestId, elapsed, maxDuration, timeout: true });
  }
};
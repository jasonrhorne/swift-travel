// Monitoring and error tracking utilities
import * as Sentry from '@sentry/node';
import { logger } from './logger';
import { getEnvironmentConfig, isProduction } from '../config/environments';

const envConfig = getEnvironmentConfig();

// Initialize Sentry
export function initSentry(dsn?: string) {
  if (!dsn) {
    logger.warn('Sentry DSN not provided, error tracking disabled');
    return;
  }

  Sentry.init({
    dsn,
    environment: envConfig.name,
    tracesSampleRate: isProduction() ? 0.1 : 1.0,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
    ],
    beforeSend(event) {
      // Filter out sensitive information
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }
      return event;
    },
  });

  logger.info('Sentry initialized for error tracking');
}

// Error tracking
export function captureError(error: Error, context?: Record<string, any>) {
  logger.error({ error: error.message, context }, 'Error captured');
  
  if (context) {
    Sentry.setContext('additional', context);
  }
  
  return Sentry.captureException(error);
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  logger[level === 'warning' ? 'warn' : level](message);
  return Sentry.captureMessage(message, level);
}

// Performance monitoring
export class PerformanceTimer {
  private startTime: number;
  private name: string;

  constructor(name: string) {
    this.name = name;
    this.startTime = Date.now();
    logger.debug({ operation: name }, 'Performance timer started');
  }

  end(metadata?: Record<string, any>) {
    const duration = Date.now() - this.startTime;
    logger.info({ 
      operation: this.name, 
      duration, 
      ...metadata 
    }, 'Performance timer ended');
    
    return duration;
  }
}

// Function wrapper for automatic performance monitoring
export function withPerformanceMonitoring<T extends any[], R>(
  name: string,
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    const timer = new PerformanceTimer(name);
    
    try {
      const result = await fn(...args);
      timer.end({ success: true });
      return result;
    } catch (error) {
      timer.end({ success: false, error: (error as Error).message });
      throw error;
    }
  };
}

// Agent pipeline monitoring
export class AgentPipelineMonitor {
  private requestId: string;
  private startTime: number;
  private stages: Record<string, { start: number; end?: number; success?: boolean }> = {};

  constructor(requestId: string) {
    this.requestId = requestId;
    this.startTime = Date.now();
    logger.info({ requestId }, 'Agent pipeline monitoring started');
  }

  startStage(stageName: string) {
    this.stages[stageName] = {
      start: Date.now(),
    };
    logger.info({ requestId: this.requestId, stage: stageName }, 'Agent stage started');
  }

  endStage(stageName: string, success: boolean, metadata?: Record<string, any>) {
    const stage = this.stages[stageName];
    if (!stage) {
      logger.warn({ requestId: this.requestId, stage: stageName }, 'Attempted to end unknown stage');
      return;
    }

    stage.end = Date.now();
    stage.success = success;

    const duration = stage.end - stage.start;
    
    logger.info({ 
      requestId: this.requestId, 
      stage: stageName, 
      duration, 
      success,
      ...metadata 
    }, 'Agent stage completed');
  }

  complete(success: boolean) {
    const totalDuration = Date.now() - this.startTime;
    const stagesSummary = Object.entries(this.stages).map(([name, stage]) => ({
      name,
      duration: stage.end ? stage.end - stage.start : null,
      success: stage.success,
    }));

    logger.info({
      requestId: this.requestId,
      totalDuration,
      success,
      stages: stagesSummary,
    }, 'Agent pipeline completed');

    // Send metrics to monitoring service
    if (isProduction()) {
      Sentry.addBreadcrumb({
        message: 'Agent pipeline completed',
        data: {
          requestId: this.requestId,
          totalDuration,
          success,
          stageCount: Object.keys(this.stages).length,
        },
      });
    }
  }
}

// Health check utilities
export interface HealthCheck {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  message?: string;
  duration?: number;
}

export async function checkHealth(): Promise<{ status: 'healthy' | 'unhealthy'; checks: HealthCheck[] }> {
  const checks: HealthCheck[] = [];
  
  // Add health checks here as services are implemented
  // Example:
  // checks.push(await checkDatabaseHealth());
  // checks.push(await checkRedisHealth());
  
  const overallStatus = checks.some(check => check.status === 'unhealthy') ? 'unhealthy' : 'healthy';
  
  logger.info({ status: overallStatus, checks }, 'Health check completed');
  
  return { status: overallStatus, checks };
}

// Metrics collection
export interface Metric {
  name: string;
  value: number;
  type: 'counter' | 'gauge' | 'histogram';
  tags?: Record<string, string>;
  timestamp?: Date;
}

export class MetricsCollector {
  private metrics: Metric[] = [];

  increment(name: string, value: number = 1, tags?: Record<string, string>) {
    this.metrics.push({
      name,
      value,
      type: 'counter',
      tags,
      timestamp: new Date(),
    });
  }

  gauge(name: string, value: number, tags?: Record<string, string>) {
    this.metrics.push({
      name,
      value,
      type: 'gauge', 
      tags,
      timestamp: new Date(),
    });
  }

  histogram(name: string, value: number, tags?: Record<string, string>) {
    this.metrics.push({
      name,
      value,
      type: 'histogram',
      tags,
      timestamp: new Date(),
    });
  }

  flush(): Metric[] {
    const currentMetrics = [...this.metrics];
    this.metrics = [];
    return currentMetrics;
  }
}

export const metrics = new MetricsCollector();
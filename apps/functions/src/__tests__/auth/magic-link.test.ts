import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { HandlerEvent, HandlerContext, HandlerResponse } from '@netlify/functions';

// Mock all dependencies with factory functions
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({})
}));

vi.mock('ioredis', () => ({
  default: class MockRedis {
    get = vi.fn();
    setex = vi.fn();
    del = vi.fn();
  }
}));

vi.mock('pino', () => ({
  default: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  })
}));

vi.mock('@swift-travel/shared/config/auth', () => ({
  authConfig: {
    supabaseUrl: 'test-url',
    supabaseServiceRoleKey: 'test-key',
    upstashRedisUrl: 'redis://test',
    upstashRedisToken: 'test-token',
    tokenExpirationMinutes: 15,
    rateLimitPerWindow: 5,
    rateLimitWindowMinutes: 15,
    jwtSecret: 'test-secret'
  }
}));

vi.mock('../../shared/email-service', () => ({
  emailService: {
    sendMagicLinkEmail: vi.fn()
  }
}));

// Import the handler after mocks are set up
import { handler } from '../../auth/magic-link';

// Test helper to create mock events
function createMockEvent(overrides: Partial<HandlerEvent> = {}): HandlerEvent {
  return {
    httpMethod: 'POST',
    path: '/auth/magic-link',
    body: null,
    headers: {},
    rawUrl: 'http://localhost:8888/.netlify/functions/auth/magic-link',
    rawQuery: '',
    multiValueHeaders: {},
    queryStringParameters: {},
    multiValueQueryStringParameters: {},
    isBase64Encoded: false,
    ...overrides
  };
}

function createMockContext(): HandlerContext {
  return {
    functionName: 'auth-magic-link',
    functionVersion: '1',
    invokedFunctionArn: 'test',
    memoryLimitInMB: '1024',
    awsRequestId: 'test-id',
    logGroupName: 'test',
    logStreamName: 'test',
    identity: undefined,
    clientContext: undefined,
    callbackWaitsForEmptyEventLoop: false,
    getRemainingTimeInMillis: () => 5000,
    done: () => {},
    fail: () => {},
    succeed: () => {}
  };
}

describe('Magic Link Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('POST /auth/magic-link', () => {
    it('should reject invalid email format', async () => {
      const event = createMockEvent({
        body: JSON.stringify({ email: 'invalid-email' })
      });
      const context = createMockContext();

      const response = await handler(event, context) as HandlerResponse;

      expect(response!.statusCode).toBe(400);
      expect(JSON.parse(response!.body!)).toMatchObject({
        error: 'Invalid request data',
        message: expect.stringContaining('Invalid email address')
      });
    });

    it('should reject non-POST requests', async () => {
      const event = createMockEvent({
        httpMethod: 'GET'
      });
      const context = createMockContext();

      const response = await handler(event, context) as HandlerResponse;

      expect(response!.statusCode).toBe(405);
      expect(JSON.parse(response!.body!)).toMatchObject({
        error: 'Method not allowed'
      });
    });

    it('should require request body', async () => {
      const event = createMockEvent();
      const context = createMockContext();

      const response = await handler(event, context) as HandlerResponse;

      expect(response!.statusCode).toBe(400);
      expect(JSON.parse(response!.body!)).toMatchObject({
        error: 'Missing request body'
      });
    });
  });
});
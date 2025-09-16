import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { HandlerEvent, HandlerContext, HandlerResponse } from '@netlify/functions';

// Mock all dependencies
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          single: vi.fn()
        })
      }),
      insert: () => ({
        select: () => ({
          single: vi.fn()
        })
      }),
      update: () => ({
        eq: () => ({
          select: () => ({
            single: vi.fn()
          })
        })
      })
    })
  })
}));

vi.mock('ioredis', () => ({
  default: class MockRedis {
    get = vi.fn();
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

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(() => 'test-jwt-token')
  }
}));

vi.mock('@swift-travel/shared/config/auth', () => ({
  authConfig: {
    supabaseUrl: 'test-url',
    supabaseServiceRoleKey: 'test-key',
    upstashRedisUrl: 'redis://test',
    upstashRedisToken: 'test-token',
    sessionExpirationHours: 24,
    jwtSecret: 'test-secret'
  }
}));

// Import the handler after mocks are set up
import { handler } from '../../auth/verify';

// Test helper to create mock events
function createMockEvent(overrides: Partial<HandlerEvent> = {}): HandlerEvent {
  return {
    httpMethod: 'POST',
    path: '/auth/verify',
    body: null,
    headers: {},
    rawUrl: 'http://localhost:8888/.netlify/functions/auth/verify',
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
    functionName: 'auth-verify',
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

describe('Token Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('POST /auth/verify', () => {
    it('should reject invalid token', async () => {
      const event = createMockEvent({
        body: JSON.stringify({ token: 'invalid-token' })
      });

      const response = await handler(event, createMockContext()) as HandlerResponse;

      expect(response!.statusCode).toBe(401);
      expect(JSON.parse(response!.body!)).toMatchObject({
        error: 'Invalid token',
        message: expect.stringContaining('invalid or has expired')
      });
    });

    it('should reject missing token', async () => {
      const event = createMockEvent({
        body: JSON.stringify({})
      });

      const response = await handler(event, createMockContext()) as HandlerResponse;

      expect(response!.statusCode).toBe(400);
      expect(JSON.parse(response!.body!)).toMatchObject({
        error: 'Invalid request data',
        message: 'Required'
      });
    });

    it('should reject non-POST requests', async () => {
      const event = createMockEvent({
        httpMethod: 'GET'
      });

      const response = await handler(event, createMockContext()) as HandlerResponse;

      expect(response!.statusCode).toBe(405);
      expect(JSON.parse(response!.body!)).toMatchObject({
        error: 'Method not allowed'
      });
    });
  });
});
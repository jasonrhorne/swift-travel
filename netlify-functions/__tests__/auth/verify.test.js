"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
// Mock all dependencies
vitest_1.vi.mock('@supabase/supabase-js', () => ({
    createClient: () => ({
        from: () => ({
            select: () => ({
                eq: () => ({
                    single: vitest_1.vi.fn()
                })
            }),
            insert: () => ({
                select: () => ({
                    single: vitest_1.vi.fn()
                })
            }),
            update: () => ({
                eq: () => ({
                    select: () => ({
                        single: vitest_1.vi.fn()
                    })
                })
            })
        })
    })
}));
vitest_1.vi.mock('ioredis', () => ({
    default: class MockRedis {
        get = vitest_1.vi.fn();
        del = vitest_1.vi.fn();
    }
}));
vitest_1.vi.mock('pino', () => ({
    default: () => ({
        info: vitest_1.vi.fn(),
        warn: vitest_1.vi.fn(),
        error: vitest_1.vi.fn()
    })
}));
vitest_1.vi.mock('jsonwebtoken', () => ({
    default: {
        sign: vitest_1.vi.fn(() => 'test-jwt-token')
    }
}));
vitest_1.vi.mock('@swift-travel/shared/config/auth', () => ({
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
const verify_1 = require("../../auth/verify");
// Test helper to create mock events
function createMockEvent(overrides = {}) {
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
function createMockContext() {
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
        done: () => { },
        fail: () => { },
        succeed: () => { }
    };
}
(0, vitest_1.describe)('Token Verification', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.resetAllMocks();
    });
    (0, vitest_1.describe)('POST /auth/verify', () => {
        (0, vitest_1.it)('should reject invalid token', async () => {
            const event = createMockEvent({
                body: JSON.stringify({ token: 'invalid-token' })
            });
            const response = await (0, verify_1.handler)(event, createMockContext());
            (0, vitest_1.expect)(response.statusCode).toBe(401);
            (0, vitest_1.expect)(JSON.parse(response.body)).toMatchObject({
                error: 'Invalid token',
                message: vitest_1.expect.stringContaining('invalid or has expired')
            });
        });
        (0, vitest_1.it)('should reject missing token', async () => {
            const event = createMockEvent({
                body: JSON.stringify({})
            });
            const response = await (0, verify_1.handler)(event, createMockContext());
            (0, vitest_1.expect)(response.statusCode).toBe(400);
            (0, vitest_1.expect)(JSON.parse(response.body)).toMatchObject({
                error: 'Invalid request data',
                message: 'Required'
            });
        });
        (0, vitest_1.it)('should reject non-POST requests', async () => {
            const event = createMockEvent({
                httpMethod: 'GET'
            });
            const response = await (0, verify_1.handler)(event, createMockContext());
            (0, vitest_1.expect)(response.statusCode).toBe(405);
            (0, vitest_1.expect)(JSON.parse(response.body)).toMatchObject({
                error: 'Method not allowed'
            });
        });
    });
});

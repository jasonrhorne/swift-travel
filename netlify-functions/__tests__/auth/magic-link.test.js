"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
// Mock all dependencies with factory functions
vitest_1.vi.mock('@supabase/supabase-js', () => ({
    createClient: () => ({})
}));
vitest_1.vi.mock('ioredis', () => ({
    default: class MockRedis {
        get = vitest_1.vi.fn();
        setex = vitest_1.vi.fn();
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
vitest_1.vi.mock('@swift-travel/shared/config/auth', () => ({
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
vitest_1.vi.mock('../../shared/email-service', () => ({
    emailService: {
        sendMagicLinkEmail: vitest_1.vi.fn()
    }
}));
// Import the handler after mocks are set up
const magic_link_1 = require("../../auth/magic-link");
// Test helper to create mock events
function createMockEvent(overrides = {}) {
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
function createMockContext() {
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
        done: () => { },
        fail: () => { },
        succeed: () => { }
    };
}
(0, vitest_1.describe)('Magic Link Authentication', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.resetAllMocks();
    });
    (0, vitest_1.describe)('POST /auth/magic-link', () => {
        (0, vitest_1.it)('should reject invalid email format', async () => {
            const event = createMockEvent({
                body: JSON.stringify({ email: 'invalid-email' })
            });
            const context = createMockContext();
            const response = await (0, magic_link_1.handler)(event, context);
            (0, vitest_1.expect)(response.statusCode).toBe(400);
            (0, vitest_1.expect)(JSON.parse(response.body)).toMatchObject({
                error: 'Invalid request data',
                message: vitest_1.expect.stringContaining('Invalid email address')
            });
        });
        (0, vitest_1.it)('should reject non-POST requests', async () => {
            const event = createMockEvent({
                httpMethod: 'GET'
            });
            const context = createMockContext();
            const response = await (0, magic_link_1.handler)(event, context);
            (0, vitest_1.expect)(response.statusCode).toBe(405);
            (0, vitest_1.expect)(JSON.parse(response.body)).toMatchObject({
                error: 'Method not allowed'
            });
        });
        (0, vitest_1.it)('should require request body', async () => {
            const event = createMockEvent();
            const context = createMockContext();
            const response = await (0, magic_link_1.handler)(event, context);
            (0, vitest_1.expect)(response.statusCode).toBe(400);
            (0, vitest_1.expect)(JSON.parse(response.body)).toMatchObject({
                error: 'Missing request body'
            });
        });
    });
});

"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
// Mock dependencies
vitest_1.vi.mock('@upstash/redis', () => ({
    Redis: vitest_1.vi.fn().mockImplementation(() => ({
        get: vitest_1.vi.fn(),
        set: vitest_1.vi.fn(),
        setex: vitest_1.vi.fn()
    }))
}));
vitest_1.vi.mock('openai', () => ({
    default: vitest_1.vi.fn().mockImplementation(() => ({
        chat: {
            completions: {
                create: vitest_1.vi.fn()
            }
        }
    }))
}));
vitest_1.vi.mock('@swift-travel/shared/config', () => ({
    config: {
        redis: { url: 'mock://redis', token: 'mock-token' },
        api: { openaiApiKey: 'mock-key', internalApiKey: 'mock-internal' }
    }
}));
vitest_1.vi.mock('../../shared/auth', () => ({
    requireInternalAuth: vitest_1.vi.fn().mockResolvedValue(true)
}));
vitest_1.vi.mock('../../shared/response', () => ({
    createErrorResponse: vitest_1.vi.fn((code, message, data) => ({ statusCode: code, body: JSON.stringify({ error: message, data }) })),
    createSuccessResponse: vitest_1.vi.fn((data) => ({ statusCode: 200, body: JSON.stringify({ success: true, data }) }))
}));
vitest_1.vi.mock('../../shared/logger', () => ({
    agentLogger: {
        agentStart: vitest_1.vi.fn(),
        agentComplete: vitest_1.vi.fn(),
        agentError: vitest_1.vi.fn(),
        orchestrationEvent: vitest_1.vi.fn(),
        timeout: vitest_1.vi.fn()
    }
}));
vitest_1.vi.mock('../../itineraries/process-request', () => ({
    getItineraryRequest: vitest_1.vi.fn(),
    saveItineraryRequest: vitest_1.vi.fn(),
    completeAgentProcessing: vitest_1.vi.fn(),
    handleAgentFailure: vitest_1.vi.fn()
}));
const research_1 = require("../../agents/research");
(0, vitest_1.describe)('Research Agent Unit Tests', () => {
    let mockItineraryRequest;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        mockItineraryRequest = {
            id: 'test-request-id',
            userId: 'test-user',
            itineraryId: null,
            requirements: {
                destination: 'Paris, France',
                interests: ['Photography', 'Food'],
                duration: 'long-weekend',
                travelerComposition: { adults: 2, children: 0, childrenAges: [] },
                groupSize: 2,
                specialRequests: [],
                accessibilityNeeds: []
            },
            status: 'research-in-progress',
            processingLog: [],
            errorDetails: null,
            createdAt: new Date(),
            updatedAt: new Date()
        };
    });
    (0, vitest_1.it)('should successfully process research request with valid input', async () => {
        // Arrange
        const mockEvent = {
            httpMethod: 'POST',
            body: JSON.stringify({ requestId: 'test-request-id' }),
            headers: { 'X-Internal-Token': 'mock-internal' },
            multiValueHeaders: {},
            isBase64Encoded: false,
            path: '/research',
            queryStringParameters: {},
            multiValueQueryStringParameters: {}
        };
        const mockResearchResults = {
            destination: {
                name: 'Paris',
                city: 'Paris',
                country: 'France',
                coordinates: { lat: 48.8566, lng: 2.3522 }
            },
            context: {
                culturalHighlights: ['Louvre Museum', 'Eiffel Tower'],
                photographySpots: ['Montmartre', 'Seine River'],
                seasonalConsiderations: 'Perfect time for outdoor photography'
            }
        };
        // Mock dependencies
        const { getItineraryRequest } = await Promise.resolve().then(() => __importStar(require('../../itineraries/process-request')));
        const { Redis } = await Promise.resolve().then(() => __importStar(require('@upstash/redis')));
        const OpenAI = (await Promise.resolve().then(() => __importStar(require('openai')))).default;
        vitest_1.vi.mocked(getItineraryRequest).mockResolvedValue(mockItineraryRequest);
        const mockRedis = {
            setex: vitest_1.vi.fn().mockResolvedValue('OK')
        };
        vitest_1.vi.mocked(Redis).mockImplementation(() => mockRedis);
        const mockOpenAI = {
            chat: {
                completions: {
                    create: vitest_1.vi.fn().mockResolvedValue({
                        choices: [{
                                message: {
                                    content: JSON.stringify(mockResearchResults)
                                }
                            }]
                    })
                }
            }
        };
        vitest_1.vi.mocked(OpenAI).mockImplementation(() => mockOpenAI);
        // Act
        const response = await (0, research_1.handler)(mockEvent);
        // Assert
        (0, vitest_1.expect)(response.statusCode).toBe(200);
        const responseData = JSON.parse(response.body);
        (0, vitest_1.expect)(responseData.success).toBe(true);
        (0, vitest_1.expect)(responseData.data.status).toBe('research-completed');
        (0, vitest_1.expect)(mockRedis.setex).toHaveBeenCalledWith('research_results:test-request-id', 3600, JSON.stringify(mockResearchResults));
    });
    (0, vitest_1.it)('should handle missing request ID', async () => {
        // Arrange
        const mockEvent = {
            httpMethod: 'POST',
            body: JSON.stringify({}),
            headers: { 'X-Internal-Token': 'mock-internal' },
            multiValueHeaders: {},
            isBase64Encoded: false,
            path: '/research',
            queryStringParameters: {},
            multiValueQueryStringParameters: {}
        };
        // Act
        const response = await (0, research_1.handler)(mockEvent);
        // Assert
        (0, vitest_1.expect)(response.statusCode).toBe(400);
        const responseData = JSON.parse(response.body);
        (0, vitest_1.expect)(responseData.error).toContain('Missing requestId');
    });
    (0, vitest_1.it)('should handle invalid HTTP method', async () => {
        // Arrange
        const mockEvent = {
            httpMethod: 'GET',
            body: null,
            headers: {},
            multiValueHeaders: {},
            isBase64Encoded: false,
            path: '/research',
            queryStringParameters: {},
            multiValueQueryStringParameters: {}
        };
        // Act
        const response = await (0, research_1.handler)(mockEvent);
        // Assert
        (0, vitest_1.expect)(response.statusCode).toBe(405);
        const responseData = JSON.parse(response.body);
        (0, vitest_1.expect)(responseData.error).toContain('Method not allowed');
    });
    (0, vitest_1.it)('should handle OpenAI API errors gracefully', async () => {
        // Arrange
        const mockEvent = {
            httpMethod: 'POST',
            body: JSON.stringify({ requestId: 'test-request-id' }),
            headers: { 'X-Internal-Token': 'mock-internal' },
            multiValueHeaders: {},
            isBase64Encoded: false,
            path: '/research',
            queryStringParameters: {},
            multiValueQueryStringParameters: {}
        };
        // Mock dependencies
        const { getItineraryRequest, handleAgentFailure } = await Promise.resolve().then(() => __importStar(require('../../itineraries/process-request')));
        const OpenAI = (await Promise.resolve().then(() => __importStar(require('openai')))).default;
        vitest_1.vi.mocked(getItineraryRequest).mockResolvedValue(mockItineraryRequest);
        const mockOpenAI = {
            chat: {
                completions: {
                    create: vitest_1.vi.fn().mockRejectedValue(new Error('OpenAI API Error'))
                }
            }
        };
        vitest_1.vi.mocked(OpenAI).mockImplementation(() => mockOpenAI);
        // Act
        const response = await (0, research_1.handler)(mockEvent);
        // Assert
        (0, vitest_1.expect)(response.statusCode).toBe(500);
        (0, vitest_1.expect)(handleAgentFailure).toHaveBeenCalledWith('test-request-id', 'research', vitest_1.expect.any(Error));
    });
    (0, vitest_1.it)('should handle missing itinerary request', async () => {
        // Arrange
        const mockEvent = {
            httpMethod: 'POST',
            body: JSON.stringify({ requestId: 'nonexistent-id' }),
            headers: { 'X-Internal-Token': 'mock-internal' },
            multiValueHeaders: {},
            isBase64Encoded: false,
            path: '/research',
            queryStringParameters: {},
            multiValueQueryStringParameters: {}
        };
        // Mock dependencies
        const { getItineraryRequest } = await Promise.resolve().then(() => __importStar(require('../../itineraries/process-request')));
        vitest_1.vi.mocked(getItineraryRequest).mockResolvedValue(null);
        // Act
        const response = await (0, research_1.handler)(mockEvent);
        // Assert
        (0, vitest_1.expect)(response.statusCode).toBe(404);
        const responseData = JSON.parse(response.body);
        (0, vitest_1.expect)(responseData.error).toContain('Itinerary request not found');
    });
});

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
const curation_1 = require("../../agents/curation");
(0, vitest_1.describe)('Curation Agent Unit Tests', () => {
    let mockItineraryRequest;
    let mockResearchResults;
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
            status: 'curation-in-progress',
            processingLog: [],
            errorDetails: null,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        mockResearchResults = {
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
    });
    (0, vitest_1.it)('should successfully process curation request with valid research results', async () => {
        // Arrange
        const mockEvent = {
            httpMethod: 'POST',
            body: JSON.stringify({ requestId: 'test-request-id' }),
            headers: { 'X-Internal-Token': 'mock-internal' },
            multiValueHeaders: {},
            isBase64Encoded: false,
            path: '/curation',
            queryStringParameters: {},
            multiValueQueryStringParameters: {}
        };
        const mockCurationResults = {
            itineraryOverview: {
                title: 'Photography Adventure in Paris',
                summary: 'A curated 4-day photography journey through Paris',
                estimatedCost: { min: 800, max: 1200, currency: 'EUR' }
            },
            activities: [
                {
                    id: 'activity-1',
                    name: 'Louvre Museum Photography Tour',
                    type: 'cultural',
                    duration: 180,
                    location: {
                        name: 'Louvre Museum',
                        address: 'Rue de Rivoli, 75001 Paris',
                        coordinates: { lat: 48.8606, lng: 2.3376 }
                    },
                    personaContext: {
                        whyRecommended: 'Perfect for photography enthusiasts',
                        photographyNotes: 'Best lighting in the morning'
                    }
                }
            ],
            curationMetadata: {
                personaAdherence: 0.95,
                logisticalScore: 0.88,
                budgetCompliance: 0.92
            }
        };
        // Mock dependencies
        const { getItineraryRequest } = await Promise.resolve().then(() => __importStar(require('../../itineraries/process-request')));
        const { Redis } = await Promise.resolve().then(() => __importStar(require('@upstash/redis')));
        const OpenAI = (await Promise.resolve().then(() => __importStar(require('openai')))).default;
        vitest_1.vi.mocked(getItineraryRequest).mockResolvedValue(mockItineraryRequest);
        const mockRedis = {
            get: vitest_1.vi.fn().mockResolvedValue(JSON.stringify(mockResearchResults)),
            setex: vitest_1.vi.fn().mockResolvedValue('OK')
        };
        vitest_1.vi.mocked(Redis).mockImplementation(() => mockRedis);
        const mockOpenAI = {
            chat: {
                completions: {
                    create: vitest_1.vi.fn().mockResolvedValue({
                        choices: [{
                                message: {
                                    content: JSON.stringify(mockCurationResults)
                                }
                            }]
                    })
                }
            }
        };
        vitest_1.vi.mocked(OpenAI).mockImplementation(() => mockOpenAI);
        // Act
        const response = await (0, curation_1.handler)(mockEvent);
        // Assert
        (0, vitest_1.expect)(response.statusCode).toBe(200);
        const responseData = JSON.parse(response.body);
        (0, vitest_1.expect)(responseData.success).toBe(true);
        (0, vitest_1.expect)(responseData.data.status).toBe('curation-completed');
        (0, vitest_1.expect)(mockRedis.setex).toHaveBeenCalledWith('curation_results:test-request-id', 3600, JSON.stringify(mockCurationResults));
    });
    (0, vitest_1.it)('should handle missing research results', async () => {
        // Arrange
        const mockEvent = {
            httpMethod: 'POST',
            body: JSON.stringify({ requestId: 'test-request-id' }),
            headers: { 'X-Internal-Token': 'mock-internal' },
            multiValueHeaders: {},
            isBase64Encoded: false,
            path: '/curation',
            queryStringParameters: {},
            multiValueQueryStringParameters: {}
        };
        // Mock dependencies
        const { getItineraryRequest } = await Promise.resolve().then(() => __importStar(require('../../itineraries/process-request')));
        const { Redis } = await Promise.resolve().then(() => __importStar(require('@upstash/redis')));
        vitest_1.vi.mocked(getItineraryRequest).mockResolvedValue(mockItineraryRequest);
        const mockRedis = {
            get: vitest_1.vi.fn().mockResolvedValue(null), // No research results
            setex: vitest_1.vi.fn()
        };
        vitest_1.vi.mocked(Redis).mockImplementation(() => mockRedis);
        // Act
        const response = await (0, curation_1.handler)(mockEvent);
        // Assert
        (0, vitest_1.expect)(response.statusCode).toBe(400);
        const responseData = JSON.parse(response.body);
        (0, vitest_1.expect)(responseData.error).toContain('research results not found');
    });
    (0, vitest_1.it)('should handle invalid curation output format', async () => {
        // Arrange
        const mockEvent = {
            httpMethod: 'POST',
            body: JSON.stringify({ requestId: 'test-request-id' }),
            headers: { 'X-Internal-Token': 'mock-internal' },
            multiValueHeaders: {},
            isBase64Encoded: false,
            path: '/curation',
            queryStringParameters: {},
            multiValueQueryStringParameters: {}
        };
        // Mock dependencies
        const { getItineraryRequest } = await Promise.resolve().then(() => __importStar(require('../../itineraries/process-request')));
        const { Redis } = await Promise.resolve().then(() => __importStar(require('@upstash/redis')));
        const OpenAI = (await Promise.resolve().then(() => __importStar(require('openai')))).default;
        vitest_1.vi.mocked(getItineraryRequest).mockResolvedValue(mockItineraryRequest);
        const mockRedis = {
            get: vitest_1.vi.fn().mockResolvedValue(JSON.stringify(mockResearchResults)),
            setex: vitest_1.vi.fn()
        };
        vitest_1.vi.mocked(Redis).mockImplementation(() => mockRedis);
        const mockOpenAI = {
            chat: {
                completions: {
                    create: vitest_1.vi.fn().mockResolvedValue({
                        choices: [{
                                message: {
                                    content: 'Invalid JSON response'
                                }
                            }]
                    })
                }
            }
        };
        vitest_1.vi.mocked(OpenAI).mockImplementation(() => mockOpenAI);
        // Act
        const response = await (0, curation_1.handler)(mockEvent);
        // Assert
        (0, vitest_1.expect)(response.statusCode).toBe(500);
        const responseData = JSON.parse(response.body);
        (0, vitest_1.expect)(responseData.error).toContain('Error processing curation request');
    });
    (0, vitest_1.it)('should validate activity structure in curation results', async () => {
        // Arrange
        const mockEvent = {
            httpMethod: 'POST',
            body: JSON.stringify({ requestId: 'test-request-id' }),
            headers: { 'X-Internal-Token': 'mock-internal' },
            multiValueHeaders: {},
            isBase64Encoded: false,
            path: '/curation',
            queryStringParameters: {},
            multiValueQueryStringParameters: {}
        };
        const invalidCurationResults = {
            itineraryOverview: {
                title: 'Test Itinerary'
            },
            activities: [
                {
                    name: 'Missing required fields' // Missing id, type, duration, location
                }
            ]
        };
        // Mock dependencies
        const { getItineraryRequest } = await Promise.resolve().then(() => __importStar(require('../../itineraries/process-request')));
        const { Redis } = await Promise.resolve().then(() => __importStar(require('@upstash/redis')));
        const OpenAI = (await Promise.resolve().then(() => __importStar(require('openai')))).default;
        vitest_1.vi.mocked(getItineraryRequest).mockResolvedValue(mockItineraryRequest);
        const mockRedis = {
            get: vitest_1.vi.fn().mockResolvedValue(JSON.stringify(mockResearchResults)),
            setex: vitest_1.vi.fn()
        };
        vitest_1.vi.mocked(Redis).mockImplementation(() => mockRedis);
        const mockOpenAI = {
            chat: {
                completions: {
                    create: vitest_1.vi.fn().mockResolvedValue({
                        choices: [{
                                message: {
                                    content: JSON.stringify(invalidCurationResults)
                                }
                            }]
                    })
                }
            }
        };
        vitest_1.vi.mocked(OpenAI).mockImplementation(() => mockOpenAI);
        // Act
        const response = await (0, curation_1.handler)(mockEvent);
        // Assert
        (0, vitest_1.expect)(response.statusCode).toBe(500);
        const responseData = JSON.parse(response.body);
        (0, vitest_1.expect)(responseData.error).toContain('Error processing curation request');
    });
    (0, vitest_1.it)('should handle request ID missing from body', async () => {
        // Arrange
        const mockEvent = {
            httpMethod: 'POST',
            body: JSON.stringify({}),
            headers: { 'X-Internal-Token': 'mock-internal' },
            multiValueHeaders: {},
            isBase64Encoded: false,
            path: '/curation',
            queryStringParameters: {},
            multiValueQueryStringParameters: {}
        };
        // Act
        const response = await (0, curation_1.handler)(mockEvent);
        // Assert
        (0, vitest_1.expect)(response.statusCode).toBe(400);
        const responseData = JSON.parse(response.body);
        (0, vitest_1.expect)(responseData.error).toContain('Missing requestId');
    });
});

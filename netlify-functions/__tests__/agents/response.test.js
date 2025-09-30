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
vitest_1.vi.mock('@supabase/supabase-js', () => ({
    createClient: vitest_1.vi.fn()
}));
vitest_1.vi.mock('@swift-travel/shared/config', () => ({
    config: {
        redis: { url: 'mock://redis', token: 'mock-token' },
        api: { internalApiKey: 'mock-internal' },
        database: {
            url: 'mock://supabase',
            serviceRoleKey: 'mock-service-key'
        }
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
const response_1 = require("../../agents/response");
(0, vitest_1.describe)('Response Agent Unit Tests', () => {
    let mockItineraryRequest;
    let mockResearchResults;
    let mockCurationResults;
    let mockValidationResults;
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
            status: 'response-in-progress',
            processingLog: [
                {
                    agent: 'research',
                    startTime: new Date('2024-01-01T10:00:00Z'),
                    endTime: new Date('2024-01-01T10:02:00Z'),
                    status: 'completed',
                    data: {},
                    error: null
                },
                {
                    agent: 'curation',
                    startTime: new Date('2024-01-01T10:02:00Z'),
                    endTime: new Date('2024-01-01T10:05:00Z'),
                    status: 'completed',
                    data: {},
                    error: null
                },
                {
                    agent: 'validation',
                    startTime: new Date('2024-01-01T10:05:00Z'),
                    endTime: new Date('2024-01-01T10:07:00Z'),
                    status: 'completed',
                    data: {},
                    error: null
                }
            ],
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
                photographySpots: ['Montmartre', 'Seine River']
            }
        };
        mockCurationResults = {
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
                        whyRecommended: 'Perfect for photography enthusiasts'
                    }
                }
            ],
            curationMetadata: {
                personaAdherence: 0.95,
                logisticalScore: 0.88,
                budgetCompliance: 0.92
            }
        };
        mockValidationResults = {
            validatedActivities: [
                {
                    activityId: 'activity-1',
                    validation: {
                        locationVerified: true,
                        placeId: 'ChIJD3uTd9hx5kcR1IQvGfr8dbk',
                        confidence: 0.95,
                        issues: []
                    }
                }
            ],
            validationSummary: {
                totalActivities: 1,
                verifiedCount: 1,
                averageConfidence: 0.95,
                criticalIssues: 0
            }
        };
    });
    (0, vitest_1.it)('should successfully generate final response and store itinerary', async () => {
        // Arrange
        const mockEvent = {
            httpMethod: 'POST',
            body: JSON.stringify({ requestId: 'test-request-id' }),
            headers: { 'X-Internal-Token': 'mock-internal' },
            multiValueHeaders: {},
            isBase64Encoded: false,
            path: '/response',
            queryStringParameters: {},
            multiValueQueryStringParameters: {}
        };
        // Mock dependencies
        const { getItineraryRequest } = await Promise.resolve().then(() => __importStar(require('../../itineraries/process-request')));
        const { Redis } = await Promise.resolve().then(() => __importStar(require('@upstash/redis')));
        const { createClient } = await Promise.resolve().then(() => __importStar(require('@supabase/supabase-js')));
        vitest_1.vi.mocked(getItineraryRequest).mockResolvedValue(mockItineraryRequest);
        const mockRedis = {
            get: vitest_1.vi.fn()
                .mockResolvedValueOnce(JSON.stringify(mockResearchResults)) // Research results
                .mockResolvedValueOnce(JSON.stringify(mockCurationResults)) // Curation results
                .mockResolvedValueOnce(JSON.stringify(mockValidationResults)), // Validation results
            setex: vitest_1.vi.fn().mockResolvedValue('OK')
        };
        vitest_1.vi.mocked(Redis).mockImplementation(() => mockRedis);
        const mockSupabase = {
            from: vitest_1.vi.fn(() => ({
                insert: vitest_1.vi.fn().mockResolvedValue({
                    error: null,
                    data: [{ id: 'itinerary-123' }]
                })
            }))
        };
        vitest_1.vi.mocked(createClient).mockReturnValue(mockSupabase);
        // Act
        const response = await (0, response_1.handler)(mockEvent);
        // Assert
        (0, vitest_1.expect)(response.statusCode).toBe(200);
        const responseData = JSON.parse(response.body);
        (0, vitest_1.expect)(responseData.success).toBe(true);
        (0, vitest_1.expect)(responseData.data.status).toBe('completed');
        // Verify itinerary was stored
        (0, vitest_1.expect)(mockSupabase.from).toHaveBeenCalledWith('itineraries');
        // Verify response results were stored in Redis
        (0, vitest_1.expect)(mockRedis.setex).toHaveBeenCalledWith('response_results:test-request-id', 3600, vitest_1.expect.stringContaining('totalDuration'));
    });
    (0, vitest_1.it)('should handle missing agent results gracefully', async () => {
        // Arrange
        const mockEvent = {
            httpMethod: 'POST',
            body: JSON.stringify({ requestId: 'test-request-id' }),
            headers: { 'X-Internal-Token': 'mock-internal' },
            multiValueHeaders: {},
            isBase64Encoded: false,
            path: '/response',
            queryStringParameters: {},
            multiValueQueryStringParameters: {}
        };
        // Mock dependencies
        const { getItineraryRequest } = await Promise.resolve().then(() => __importStar(require('../../itineraries/process-request')));
        const { Redis } = await Promise.resolve().then(() => __importStar(require('@upstash/redis')));
        vitest_1.vi.mocked(getItineraryRequest).mockResolvedValue(mockItineraryRequest);
        const mockRedis = {
            get: vitest_1.vi.fn()
                .mockResolvedValueOnce(null) // Missing research results
                .mockResolvedValueOnce(JSON.stringify(mockCurationResults))
                .mockResolvedValueOnce(JSON.stringify(mockValidationResults)),
            setex: vitest_1.vi.fn()
        };
        vitest_1.vi.mocked(Redis).mockImplementation(() => mockRedis);
        // Act
        const response = await (0, response_1.handler)(mockEvent);
        // Assert
        (0, vitest_1.expect)(response.statusCode).toBe(400);
        const responseData = JSON.parse(response.body);
        (0, vitest_1.expect)(responseData.error).toContain('Missing agent results');
    });
    (0, vitest_1.it)('should handle database storage errors', async () => {
        // Arrange
        const mockEvent = {
            httpMethod: 'POST',
            body: JSON.stringify({ requestId: 'test-request-id' }),
            headers: { 'X-Internal-Token': 'mock-internal' },
            multiValueHeaders: {},
            isBase64Encoded: false,
            path: '/response',
            queryStringParameters: {},
            multiValueQueryStringParameters: {}
        };
        // Mock dependencies
        const { getItineraryRequest, handleAgentFailure } = await Promise.resolve().then(() => __importStar(require('../../itineraries/process-request')));
        const { Redis } = await Promise.resolve().then(() => __importStar(require('@upstash/redis')));
        const { createClient } = await Promise.resolve().then(() => __importStar(require('@supabase/supabase-js')));
        vitest_1.vi.mocked(getItineraryRequest).mockResolvedValue(mockItineraryRequest);
        const mockRedis = {
            get: vitest_1.vi.fn()
                .mockResolvedValueOnce(JSON.stringify(mockResearchResults))
                .mockResolvedValueOnce(JSON.stringify(mockCurationResults))
                .mockResolvedValueOnce(JSON.stringify(mockValidationResults)),
            setex: vitest_1.vi.fn()
        };
        vitest_1.vi.mocked(Redis).mockImplementation(() => mockRedis);
        const mockSupabase = {
            from: vitest_1.vi.fn(() => ({
                insert: vitest_1.vi.fn().mockResolvedValue({
                    error: { message: 'Database error' },
                    data: null
                })
            }))
        };
        vitest_1.vi.mocked(createClient).mockReturnValue(mockSupabase);
        // Act
        const response = await (0, response_1.handler)(mockEvent);
        // Assert
        (0, vitest_1.expect)(response.statusCode).toBe(500);
        (0, vitest_1.expect)(handleAgentFailure).toHaveBeenCalledWith('test-request-id', 'response', vitest_1.expect.any(Error));
    });
    (0, vitest_1.it)('should calculate quality scores correctly', async () => {
        // Arrange
        const mockEvent = {
            httpMethod: 'POST',
            body: JSON.stringify({ requestId: 'test-request-id' }),
            headers: { 'X-Internal-Token': 'mock-internal' },
            multiValueHeaders: {},
            isBase64Encoded: false,
            path: '/response',
            queryStringParameters: {},
            multiValueQueryStringParameters: {}
        };
        const highQualityValidationResults = {
            ...mockValidationResults,
            validationSummary: {
                totalActivities: 1,
                verifiedCount: 1,
                averageConfidence: 0.98,
                criticalIssues: 0
            }
        };
        // Mock dependencies
        const { getItineraryRequest } = await Promise.resolve().then(() => __importStar(require('../../itineraries/process-request')));
        const { Redis } = await Promise.resolve().then(() => __importStar(require('@upstash/redis')));
        const { createClient } = await Promise.resolve().then(() => __importStar(require('@supabase/supabase-js')));
        vitest_1.vi.mocked(getItineraryRequest).mockResolvedValue(mockItineraryRequest);
        const mockRedis = {
            get: vitest_1.vi.fn()
                .mockResolvedValueOnce(JSON.stringify(mockResearchResults))
                .mockResolvedValueOnce(JSON.stringify(mockCurationResults))
                .mockResolvedValueOnce(JSON.stringify(highQualityValidationResults)),
            setex: vitest_1.vi.fn().mockResolvedValue('OK')
        };
        vitest_1.vi.mocked(Redis).mockImplementation(() => mockRedis);
        const mockSupabase = {
            from: vitest_1.vi.fn(() => ({
                insert: vitest_1.vi.fn().mockResolvedValue({
                    error: null,
                    data: [{ id: 'itinerary-123' }]
                })
            }))
        };
        vitest_1.vi.mocked(createClient).mockReturnValue(mockSupabase);
        // Act
        const response = await (0, response_1.handler)(mockEvent);
        // Assert
        (0, vitest_1.expect)(response.statusCode).toBe(200);
        const responseData = JSON.parse(response.body);
        (0, vitest_1.expect)(responseData.success).toBe(true);
        // Quality score should be calculated based on validation confidence and persona adherence
        const storedResponse = JSON.parse(mockRedis.setex.mock.calls[0][2]);
        (0, vitest_1.expect)(storedResponse.qualityScore).toBeGreaterThan(0.8);
    });
    (0, vitest_1.it)('should handle missing request ID', async () => {
        // Arrange
        const mockEvent = {
            httpMethod: 'POST',
            body: JSON.stringify({}),
            headers: { 'X-Internal-Token': 'mock-internal' },
            multiValueHeaders: {},
            isBase64Encoded: false,
            path: '/response',
            queryStringParameters: {},
            multiValueQueryStringParameters: {}
        };
        // Act
        const response = await (0, response_1.handler)(mockEvent);
        // Assert
        (0, vitest_1.expect)(response.statusCode).toBe(400);
        const responseData = JSON.parse(response.body);
        (0, vitest_1.expect)(responseData.error).toContain('Missing requestId');
    });
    (0, vitest_1.it)('should calculate processing metrics correctly', async () => {
        // Arrange
        const mockEvent = {
            httpMethod: 'POST',
            body: JSON.stringify({ requestId: 'test-request-id' }),
            headers: { 'X-Internal-Token': 'mock-internal' },
            multiValueHeaders: {},
            isBase64Encoded: false,
            path: '/response',
            queryStringParameters: {},
            multiValueQueryStringParameters: {}
        };
        // Mock dependencies with the existing setup
        const { getItineraryRequest } = await Promise.resolve().then(() => __importStar(require('../../itineraries/process-request')));
        const { Redis } = await Promise.resolve().then(() => __importStar(require('@upstash/redis')));
        const { createClient } = await Promise.resolve().then(() => __importStar(require('@supabase/supabase-js')));
        vitest_1.vi.mocked(getItineraryRequest).mockResolvedValue(mockItineraryRequest);
        const mockRedis = {
            get: vitest_1.vi.fn()
                .mockResolvedValueOnce(JSON.stringify(mockResearchResults))
                .mockResolvedValueOnce(JSON.stringify(mockCurationResults))
                .mockResolvedValueOnce(JSON.stringify(mockValidationResults)),
            setex: vitest_1.vi.fn().mockResolvedValue('OK')
        };
        vitest_1.vi.mocked(Redis).mockImplementation(() => mockRedis);
        const mockSupabase = {
            from: vitest_1.vi.fn(() => ({
                insert: vitest_1.vi.fn().mockResolvedValue({
                    error: null,
                    data: [{ id: 'itinerary-123' }]
                })
            }))
        };
        vitest_1.vi.mocked(createClient).mockReturnValue(mockSupabase);
        // Act
        const response = await (0, response_1.handler)(mockEvent);
        // Assert
        (0, vitest_1.expect)(response.statusCode).toBe(200);
        // Verify processing metrics were calculated
        const storedResponse = JSON.parse(mockRedis.setex.mock.calls[0][2]);
        (0, vitest_1.expect)(storedResponse.totalDuration).toBeDefined();
        (0, vitest_1.expect)(storedResponse.agentDurations).toBeDefined();
        (0, vitest_1.expect)(storedResponse.agentDurations.research).toBe(120000); // 2 minutes
        (0, vitest_1.expect)(storedResponse.agentDurations.curation).toBe(180000); // 3 minutes
        (0, vitest_1.expect)(storedResponse.agentDurations.validation).toBe(120000); // 2 minutes
    });
});

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
vitest_1.vi.mock('@swift-travel/shared/config', () => ({
    config: {
        redis: { url: 'mock://redis', token: 'mock-token' },
        api: { googlePlacesApiKey: 'mock-places-key', internalApiKey: 'mock-internal' }
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
// Mock fetch globally
global.fetch = vitest_1.vi.fn();
const validation_1 = require("../../agents/validation");
(0, vitest_1.describe)('Validation Agent Unit Tests', () => {
    let mockItineraryRequest;
    let mockCurationResults;
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
            status: 'validation-in-progress',
            processingLog: [],
            errorDetails: null,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        mockCurationResults = {
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
                    }
                },
                {
                    id: 'activity-2',
                    name: 'Eiffel Tower Photography',
                    type: 'landmark',
                    duration: 120,
                    location: {
                        name: 'Eiffel Tower',
                        address: 'Champ de Mars, 75007 Paris',
                        coordinates: { lat: 48.8584, lng: 2.2945 }
                    }
                }
            ]
        };
    });
    (0, vitest_1.it)('should successfully validate activities with Google Places API', async () => {
        // Arrange
        const mockEvent = {
            httpMethod: 'POST',
            body: JSON.stringify({ requestId: 'test-request-id' }),
            headers: { 'X-Internal-Token': 'mock-internal' },
            multiValueHeaders: {},
            isBase64Encoded: false,
            path: '/validation',
            queryStringParameters: {},
            multiValueQueryStringParameters: {}
        };
        const mockPlacesResponse = {
            results: [
                {
                    place_id: 'ChIJD3uTd9hx5kcR1IQvGfr8dbk',
                    name: 'Louvre Museum',
                    formatted_address: 'Rue de Rivoli, 75001 Paris, France',
                    geometry: {
                        location: { lat: 48.8606111, lng: 2.337644 }
                    },
                    rating: 4.7,
                    types: ['museum', 'tourist_attraction']
                }
            ],
            status: 'OK'
        };
        // Mock dependencies
        const { getItineraryRequest } = await Promise.resolve().then(() => __importStar(require('../../itineraries/process-request')));
        const { Redis } = await Promise.resolve().then(() => __importStar(require('@upstash/redis')));
        vitest_1.vi.mocked(getItineraryRequest).mockResolvedValue(mockItineraryRequest);
        const mockRedis = {
            get: vitest_1.vi.fn().mockResolvedValue(JSON.stringify(mockCurationResults)),
            setex: vitest_1.vi.fn().mockResolvedValue('OK')
        };
        vitest_1.vi.mocked(Redis).mockImplementation(() => mockRedis);
        // Mock successful API responses for both activities
        global.fetch
            .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockPlacesResponse)
        })
            .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                ...mockPlacesResponse,
                results: [{
                        ...mockPlacesResponse.results[0],
                        name: 'Eiffel Tower',
                        place_id: 'ChIJLU7jZClu5kcR4PcOOO6p3I0'
                    }]
            })
        });
        // Act
        const response = await (0, validation_1.handler)(mockEvent);
        // Assert
        (0, vitest_1.expect)(response.statusCode).toBe(200);
        const responseData = JSON.parse(response.body);
        (0, vitest_1.expect)(responseData.success).toBe(true);
        (0, vitest_1.expect)(responseData.data.status).toBe('validation-completed');
        // Verify validation results structure
        (0, vitest_1.expect)(mockRedis.setex).toHaveBeenCalledWith('validation_results:test-request-id', 3600, vitest_1.expect.stringContaining('validationSummary'));
    });
    (0, vitest_1.it)('should handle Google Places API errors gracefully', async () => {
        // Arrange
        const mockEvent = {
            httpMethod: 'POST',
            body: JSON.stringify({ requestId: 'test-request-id' }),
            headers: { 'X-Internal-Token': 'mock-internal' },
            multiValueHeaders: {},
            isBase64Encoded: false,
            path: '/validation',
            queryStringParameters: {},
            multiValueQueryStringParameters: {}
        };
        // Mock dependencies
        const { getItineraryRequest } = await Promise.resolve().then(() => __importStar(require('../../itineraries/process-request')));
        const { Redis } = await Promise.resolve().then(() => __importStar(require('@upstash/redis')));
        vitest_1.vi.mocked(getItineraryRequest).mockResolvedValue(mockItineraryRequest);
        const mockRedis = {
            get: vitest_1.vi.fn().mockResolvedValue(JSON.stringify(mockCurationResults)),
            setex: vitest_1.vi.fn().mockResolvedValue('OK')
        };
        vitest_1.vi.mocked(Redis).mockImplementation(() => mockRedis);
        // Mock API failure
        global.fetch.mockRejectedValue(new Error('API Error'));
        // Act
        const response = await (0, validation_1.handler)(mockEvent);
        // Assert
        (0, vitest_1.expect)(response.statusCode).toBe(200); // Should still complete with failed validations
        const responseData = JSON.parse(response.body);
        (0, vitest_1.expect)(responseData.success).toBe(true);
        (0, vitest_1.expect)(responseData.data.status).toBe('validation-completed');
    });
    (0, vitest_1.it)('should handle rate limiting from Google Places API', async () => {
        // Arrange
        const mockEvent = {
            httpMethod: 'POST',
            body: JSON.stringify({ requestId: 'test-request-id' }),
            headers: { 'X-Internal-Token': 'mock-internal' },
            multiValueHeaders: {},
            isBase64Encoded: false,
            path: '/validation',
            queryStringParameters: {},
            multiValueQueryStringParameters: {}
        };
        // Mock dependencies
        const { getItineraryRequest } = await Promise.resolve().then(() => __importStar(require('../../itineraries/process-request')));
        const { Redis } = await Promise.resolve().then(() => __importStar(require('@upstash/redis')));
        vitest_1.vi.mocked(getItineraryRequest).mockResolvedValue(mockItineraryRequest);
        const mockRedis = {
            get: vitest_1.vi.fn().mockResolvedValue(JSON.stringify(mockCurationResults)),
            setex: vitest_1.vi.fn().mockResolvedValue('OK')
        };
        vitest_1.vi.mocked(Redis).mockImplementation(() => mockRedis);
        // Mock rate limiting response
        global.fetch.mockResolvedValue({
            ok: false,
            status: 429,
            json: () => Promise.resolve({
                error_message: 'Rate limit exceeded',
                status: 'OVER_QUERY_LIMIT'
            })
        });
        // Act
        const response = await (0, validation_1.handler)(mockEvent);
        // Assert
        (0, vitest_1.expect)(response.statusCode).toBe(200); // Should handle gracefully
        const responseData = JSON.parse(response.body);
        (0, vitest_1.expect)(responseData.success).toBe(true);
    });
    (0, vitest_1.it)('should handle missing curation results', async () => {
        // Arrange
        const mockEvent = {
            httpMethod: 'POST',
            body: JSON.stringify({ requestId: 'test-request-id' }),
            headers: { 'X-Internal-Token': 'mock-internal' },
            multiValueHeaders: {},
            isBase64Encoded: false,
            path: '/validation',
            queryStringParameters: {},
            multiValueQueryStringParameters: {}
        };
        // Mock dependencies
        const { getItineraryRequest } = await Promise.resolve().then(() => __importStar(require('../../itineraries/process-request')));
        const { Redis } = await Promise.resolve().then(() => __importStar(require('@upstash/redis')));
        vitest_1.vi.mocked(getItineraryRequest).mockResolvedValue(mockItineraryRequest);
        const mockRedis = {
            get: vitest_1.vi.fn().mockResolvedValue(null), // No curation results
            setex: vitest_1.vi.fn()
        };
        vitest_1.vi.mocked(Redis).mockImplementation(() => mockRedis);
        // Act
        const response = await (0, validation_1.handler)(mockEvent);
        // Assert
        (0, vitest_1.expect)(response.statusCode).toBe(400);
        const responseData = JSON.parse(response.body);
        (0, vitest_1.expect)(responseData.error).toContain('curation results not found');
    });
    (0, vitest_1.it)('should validate activity coordinates within reasonable bounds', async () => {
        // Arrange
        const mockEvent = {
            httpMethod: 'POST',
            body: JSON.stringify({ requestId: 'test-request-id' }),
            headers: { 'X-Internal-Token': 'mock-internal' },
            multiValueHeaders: {},
            isBase64Encoded: false,
            path: '/validation',
            queryStringParameters: {},
            multiValueQueryStringParameters: {}
        };
        const invalidLocationResults = {
            activities: [
                {
                    id: 'activity-1',
                    name: 'Invalid Location',
                    location: {
                        name: 'Nowhere',
                        address: 'Invalid Address',
                        coordinates: { lat: 999, lng: 999 } // Invalid coordinates
                    }
                }
            ]
        };
        // Mock dependencies
        const { getItineraryRequest } = await Promise.resolve().then(() => __importStar(require('../../itineraries/process-request')));
        const { Redis } = await Promise.resolve().then(() => __importStar(require('@upstash/redis')));
        vitest_1.vi.mocked(getItineraryRequest).mockResolvedValue(mockItineraryRequest);
        const mockRedis = {
            get: vitest_1.vi.fn().mockResolvedValue(JSON.stringify(invalidLocationResults)),
            setex: vitest_1.vi.fn().mockResolvedValue('OK')
        };
        vitest_1.vi.mocked(Redis).mockImplementation(() => mockRedis);
        // Mock Places API with no results
        global.fetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({
                results: [],
                status: 'ZERO_RESULTS'
            })
        });
        // Act
        const response = await (0, validation_1.handler)(mockEvent);
        // Assert
        (0, vitest_1.expect)(response.statusCode).toBe(200);
        const responseData = JSON.parse(response.body);
        (0, vitest_1.expect)(responseData.success).toBe(true);
        // Should complete but mark validation as failed
    });
    (0, vitest_1.it)('should handle invalid HTTP method', async () => {
        // Arrange
        const mockEvent = {
            httpMethod: 'GET',
            body: null,
            headers: {},
            multiValueHeaders: {},
            isBase64Encoded: false,
            path: '/validation',
            queryStringParameters: {},
            multiValueQueryStringParameters: {}
        };
        // Act
        const response = await (0, validation_1.handler)(mockEvent);
        // Assert
        (0, vitest_1.expect)(response.statusCode).toBe(405);
        const responseData = JSON.parse(response.body);
        (0, vitest_1.expect)(responseData.error).toContain('Method not allowed');
    });
});

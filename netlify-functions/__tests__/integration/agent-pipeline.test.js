"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const uuid_1 = require("uuid");
// Mock all dependencies
vitest_1.vi.mock('@upstash/redis', () => ({
    Redis: vitest_1.vi.fn().mockImplementation(() => ({
        get: vitest_1.vi.fn(),
        set: vitest_1.vi.fn(),
        setex: vitest_1.vi.fn(),
        del: vitest_1.vi.fn(),
    })),
}));
vitest_1.vi.mock('openai', () => ({
    default: vitest_1.vi.fn().mockImplementation(() => ({
        chat: {
            completions: {
                create: vitest_1.vi.fn(),
            },
        },
    })),
}));
vitest_1.vi.mock('@supabase/supabase-js', () => ({
    createClient: () => ({
        from: () => ({
            insert: vitest_1.vi.fn().mockReturnValue({ error: null }),
            select: () => ({
                eq: () => ({
                    single: vitest_1.vi.fn(),
                }),
            }),
        }),
    }),
}));
vitest_1.vi.mock('@swift-travel/shared/config', () => ({
    config: {
        redis: { url: 'mock://redis', token: 'mock-token' },
        api: {
            openaiApiKey: 'mock-openai-key',
            googlePlacesApiKey: 'mock-google-key',
            internalApiKey: 'mock-internal-key',
        },
        database: {
            url: 'mock://supabase',
            serviceRoleKey: 'mock-service-key',
        },
        frontend: {
            baseUrl: 'http://localhost:8888/.netlify/functions',
        },
    },
}));
// Mock fetch for Google Places API
global.fetch = vitest_1.vi.fn();
// Import handlers after mocking dependencies
const process_request_1 = require("../../itineraries/process-request");
const research_1 = require("../../agents/research");
const curation_1 = require("../../agents/curation");
const validation_1 = require("../../agents/validation");
const response_1 = require("../../agents/response");
(0, vitest_1.describe)('Agent Pipeline Integration Tests', () => {
    let mockRedis;
    let mockOpenAI;
    let mockEvent;
    // let mockContext: Context;
    let testRequestId;
    let mockItineraryRequest;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        testRequestId = (0, uuid_1.v4)();
        // Set up mock event and context
        // mockContext = {} as Context;
        // Create mock itinerary request
        mockItineraryRequest = {
            id: testRequestId,
            userId: 'test-user-id',
            itineraryId: null,
            requirements: {
                destination: 'Paris, France',
                interests: ['Photography', 'Food'],
                duration: 'long-weekend',
                travelerComposition: { adults: 2, children: 0, childrenAges: [] },
                groupSize: 2,
                specialRequests: ['romantic spots'],
                accessibilityNeeds: [],
            },
            processingLog: [],
            status: 'initiated',
            errorDetails: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        // Setup Redis mock
        mockRedis = {
            get: vitest_1.vi.fn(),
            set: vitest_1.vi.fn(),
            setex: vitest_1.vi.fn(),
            del: vitest_1.vi.fn(),
        };
        mockRedis.get.mockImplementation((key) => {
            if (key === `itinerary_request:${testRequestId}`) {
                return Promise.resolve(JSON.stringify(mockItineraryRequest));
            }
            if (key.startsWith('research_results:')) {
                return Promise.resolve(JSON.stringify({
                    destination: {
                        name: 'Paris',
                        city: 'Paris',
                        region: 'Île-de-France',
                        country: 'France',
                        timeZone: 'Europe/Paris',
                        coordinates: { lat: 48.8566, lng: 2.3522 },
                    },
                    contextData: {
                        culture: ['French culture', 'Art museums'],
                        cuisine: ['French cuisine', 'Cafés'],
                        attractions: ['Eiffel Tower', 'Louvre'],
                        neighborhoods: ['Marais', 'Montmartre'],
                        transportation: ['Metro', 'Walking'],
                        seasonalConsiderations: ['Pleasant summer weather'],
                        budgetInsights: {
                            'mid-range': 'Expect €100-200 per day per person',
                        },
                    },
                    personaRecommendations: {
                        photography: {
                            focus: ['Golden hour at Eiffel Tower'],
                            recommendations: ['Sunrise at Trocadéro'],
                            warnings: ['No tripods in museums'],
                        },
                    },
                    confidence: 0.95,
                }));
            }
            if (key.startsWith('curation_results:')) {
                return Promise.resolve(JSON.stringify({
                    activities: [
                        {
                            id: (0, uuid_1.v4)(),
                            itineraryId: '',
                            name: 'Eiffel Tower Photography',
                            description: 'Golden hour photography session',
                            category: 'sightseeing',
                            timing: {
                                dayNumber: 1,
                                startTime: '07:00',
                                duration: 120,
                                flexibility: 'weather-dependent',
                                bufferTime: 30,
                            },
                            location: {
                                name: 'Eiffel Tower',
                                address: 'Champ de Mars, Paris',
                                coordinates: { lat: 48.8584, lng: 2.2945 },
                                neighborhood: 'Champ de Mars',
                                googlePlaceId: null,
                                accessibility: {
                                    wheelchairAccessible: true,
                                    hearingAssistance: false,
                                    visualAssistance: false,
                                    notes: [],
                                },
                            },
                            validation: {
                                status: 'pending',
                                googlePlaceId: null,
                                lastUpdated: new Date(),
                                confidence: 0,
                                issues: [],
                            },
                            personaContext: {
                                reasoning: 'Perfect for photography enthusiasts',
                                highlights: ['Iconic architecture'],
                                tips: ['Best light in early morning'],
                            },
                        },
                    ],
                    itineraryOverview: {
                        totalActivities: 1,
                        estimatedCost: { min: 50, max: 100, currency: 'EUR' },
                        themes: ['Photography'],
                        highlights: ['Iconic Paris landmarks'],
                    },
                    curationMetadata: {
                        personaAdherence: 0.95,
                        budgetAlignment: 0.9,
                        logisticalScore: 0.85,
                        diversityScore: 0.8,
                    },
                }));
            }
            return Promise.resolve(null);
        });
        mockRedis.set.mockResolvedValue('OK');
        mockRedis.setex.mockResolvedValue('OK');
        mockRedis.del.mockResolvedValue(1);
        // Setup OpenAI mock
        mockOpenAI = {
            chat: {
                completions: {
                    create: vitest_1.vi.fn(),
                },
            },
        };
        mockOpenAI.chat.completions.create.mockResolvedValue({
            choices: [
                {
                    message: {
                        content: JSON.stringify({
                            destination: {
                                name: 'Paris',
                                city: 'Paris',
                                region: 'Île-de-France',
                                country: 'France',
                                timeZone: 'Europe/Paris',
                                coordinates: { lat: 48.8566, lng: 2.3522 },
                            },
                            contextData: {
                                culture: ['French culture'],
                                cuisine: ['French cuisine'],
                                attractions: ['Eiffel Tower'],
                                neighborhoods: ['Marais'],
                                transportation: ['Metro'],
                                seasonalConsiderations: ['Summer weather'],
                                budgetInsights: {
                                    'mid-range': 'Expect €100-200 per day',
                                },
                            },
                            personaRecommendations: {
                                photography: {
                                    focus: ['Golden hour spots'],
                                    recommendations: ['Eiffel Tower sunrise'],
                                    warnings: ['No tripods in museums'],
                                },
                            },
                            confidence: 0.95,
                        }),
                    },
                },
            ],
        });
        // Mock Google Places API
        global.fetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({
                status: 'OK',
                results: [
                    {
                        place_id: 'test-place-id',
                        name: 'Eiffel Tower',
                        formatted_address: 'Champ de Mars, 5 Avenue Anatole France, 75007 Paris, France',
                        geometry: {
                            location: { lat: 48.8584, lng: 2.2945 },
                        },
                        rating: 4.6,
                        types: ['tourist_attraction'],
                        business_status: 'OPERATIONAL',
                    },
                ],
            }),
        });
    });
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)('Complete Pipeline Flow', () => {
        (0, vitest_1.it)('should process complete agent pipeline successfully', async () => {
            // 1. Process Request Handler
            mockEvent = {
                httpMethod: 'POST',
                body: JSON.stringify({ itineraryRequestId: testRequestId }),
                headers: { 'X-Internal-Token': 'mock-internal-key' },
                multiValueHeaders: {},
                isBase64Encoded: false,
                path: '/process-request',
                queryStringParameters: {},
                multiValueQueryStringParameters: {},
                rawUrl: 'http://localhost/.netlify/functions/test',
                rawQuery: '',
            };
            const processResponse = await (0, process_request_1.handler)(mockEvent);
            (0, vitest_1.expect)(processResponse.statusCode).toBe(200);
            const processData = JSON.parse(processResponse.body);
            (0, vitest_1.expect)(processData.success).toBe(true);
            (0, vitest_1.expect)(processData.data.status).toBe('research-in-progress');
            // 2. Research Agent
            mockEvent.body = JSON.stringify({ requestId: testRequestId });
            const researchResponse = await (0, research_1.handler)(mockEvent);
            (0, vitest_1.expect)(researchResponse.statusCode).toBe(200);
            const researchData = JSON.parse(researchResponse.body);
            (0, vitest_1.expect)(researchData.success).toBe(true);
            (0, vitest_1.expect)(researchData.data.status).toBe('research-completed');
            // 3. Curation Agent
            const curationResponse = await (0, curation_1.handler)(mockEvent);
            (0, vitest_1.expect)(curationResponse.statusCode).toBe(200);
            const curationData = JSON.parse(curationResponse.body);
            (0, vitest_1.expect)(curationData.success).toBe(true);
            (0, vitest_1.expect)(curationData.data.status).toBe('curation-completed');
            // 4. Validation Agent
            const validationResponse = await (0, validation_1.handler)(mockEvent);
            (0, vitest_1.expect)(validationResponse.statusCode).toBe(200);
            const validationData = JSON.parse(validationResponse.body);
            (0, vitest_1.expect)(validationData.success).toBe(true);
            (0, vitest_1.expect)(validationData.data.status).toBe('validation-completed');
            // 5. Response Agent
            const responseResponse = await (0, response_1.handler)(mockEvent);
            (0, vitest_1.expect)(responseResponse.statusCode).toBe(200);
            const responseData = JSON.parse(responseResponse.body);
            (0, vitest_1.expect)(responseData.success).toBe(true);
            (0, vitest_1.expect)(responseData.data.status).toBe('completed');
            // Verify Redis calls
            (0, vitest_1.expect)(mockRedis.get).toHaveBeenCalledWith(`itinerary_request:${testRequestId}`);
            (0, vitest_1.expect)(mockRedis.setex).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should handle missing request gracefully', async () => {
            mockRedis.get.mockResolvedValue(null);
            mockEvent = {
                httpMethod: 'POST',
                body: JSON.stringify({ requestId: 'non-existent-id' }),
                headers: { 'X-Internal-Token': 'mock-internal-key' },
                multiValueHeaders: {},
                isBase64Encoded: false,
                path: '/research',
                queryStringParameters: {},
                multiValueQueryStringParameters: {},
                rawUrl: 'http://localhost/.netlify/functions/test',
                rawQuery: '',
            };
            const response = await (0, research_1.handler)(mockEvent);
            (0, vitest_1.expect)(response.statusCode).toBe(500);
            const data = JSON.parse(response.body);
            (0, vitest_1.expect)(data.success).toBe(false);
            (0, vitest_1.expect)(data.error.message).toContain('failed');
        });
    });
    (0, vitest_1.describe)('Error Handling and Recovery', () => {
        (0, vitest_1.it)('should handle OpenAI API failures gracefully', async () => {
            mockOpenAI.chat.completions.create.mockRejectedValue(new Error('OpenAI API Error'));
            mockEvent = {
                httpMethod: 'POST',
                body: JSON.stringify({ requestId: testRequestId }),
                headers: { 'X-Internal-Token': 'mock-internal-key' },
                multiValueHeaders: {},
                isBase64Encoded: false,
                path: '/research',
                queryStringParameters: {},
                multiValueQueryStringParameters: {},
                rawUrl: 'http://localhost/.netlify/functions/test',
                rawQuery: '',
            };
            const response = await (0, research_1.handler)(mockEvent);
            (0, vitest_1.expect)(response.statusCode).toBe(500);
            const data = JSON.parse(response.body);
            (0, vitest_1.expect)(data.success).toBe(false);
            (0, vitest_1.expect)(data.error.message).toContain('failed');
        });
        (0, vitest_1.it)('should handle Google Places API failures gracefully', async () => {
            global.fetch.mockResolvedValue({
                ok: false,
                status: 500,
                json: () => Promise.resolve({ error: 'API Error' }),
            });
            mockEvent = {
                httpMethod: 'POST',
                body: JSON.stringify({ requestId: testRequestId }),
                headers: { 'X-Internal-Token': 'mock-internal-key' },
                multiValueHeaders: {},
                isBase64Encoded: false,
                path: '/validation',
                queryStringParameters: {},
                multiValueQueryStringParameters: {},
                rawUrl: 'http://localhost/.netlify/functions/test',
                rawQuery: '',
            };
            // Should complete but with failed validations
            const response = await (0, validation_1.handler)(mockEvent);
            (0, vitest_1.expect)(response.statusCode).toBe(200);
            const data = JSON.parse(response.body);
            (0, vitest_1.expect)(data.success).toBe(true);
        });
        (0, vitest_1.it)('should handle Redis connection failures', async () => {
            mockRedis.get.mockRejectedValue(new Error('Redis connection failed'));
            mockEvent = {
                httpMethod: 'POST',
                body: JSON.stringify({ requestId: testRequestId }),
                headers: { 'X-Internal-Token': 'mock-internal-key' },
                multiValueHeaders: {},
                isBase64Encoded: false,
                path: '/research',
                queryStringParameters: {},
                multiValueQueryStringParameters: {},
                rawUrl: 'http://localhost/.netlify/functions/test',
                rawQuery: '',
            };
            const response = await (0, research_1.handler)(mockEvent);
            (0, vitest_1.expect)(response.statusCode).toBe(500);
            const data = JSON.parse(response.body);
            (0, vitest_1.expect)(data.success).toBe(false);
        });
    });
    (0, vitest_1.describe)('Authentication and Security', () => {
        (0, vitest_1.it)('should reject requests without internal token', async () => {
            mockEvent = {
                httpMethod: 'POST',
                body: JSON.stringify({ requestId: testRequestId }),
                headers: {}, // No X-Internal-Token
                multiValueHeaders: {},
                isBase64Encoded: false,
                path: '/research',
                queryStringParameters: {},
                multiValueQueryStringParameters: {},
                rawUrl: 'http://localhost/.netlify/functions/test',
                rawQuery: '',
            };
            const response = await (0, research_1.handler)(mockEvent);
            (0, vitest_1.expect)(response.statusCode).toBe(500);
            const data = JSON.parse(response.body);
            (0, vitest_1.expect)(data.success).toBe(false);
        });
        (0, vitest_1.it)('should reject requests with invalid internal token', async () => {
            mockEvent = {
                httpMethod: 'POST',
                body: JSON.stringify({ requestId: testRequestId }),
                headers: { 'X-Internal-Token': 'invalid-token' },
                multiValueHeaders: {},
                isBase64Encoded: false,
                path: '/research',
                queryStringParameters: {},
                multiValueQueryStringParameters: {},
                rawUrl: 'http://localhost/.netlify/functions/test',
                rawQuery: '',
            };
            const response = await (0, research_1.handler)(mockEvent);
            (0, vitest_1.expect)(response.statusCode).toBe(500);
            const data = JSON.parse(response.body);
            (0, vitest_1.expect)(data.success).toBe(false);
        });
    });
    (0, vitest_1.describe)('Processing Time Monitoring', () => {
        (0, vitest_1.it)('should set timeout monitoring for requests', async () => {
            mockEvent = {
                httpMethod: 'POST',
                body: JSON.stringify({ itineraryRequestId: testRequestId }),
                headers: { 'X-Internal-Token': 'mock-internal-key' },
                multiValueHeaders: {},
                isBase64Encoded: false,
                path: '/process-request',
                queryStringParameters: {},
                multiValueQueryStringParameters: {},
                rawUrl: 'http://localhost/.netlify/functions/test',
                rawQuery: '',
            };
            const response = await (0, process_request_1.handler)(mockEvent);
            (0, vitest_1.expect)(response.statusCode).toBe(200);
            // Verify timeout monitoring was set
            (0, vitest_1.expect)(mockRedis.setex).toHaveBeenCalledWith(vitest_1.expect.stringContaining(`processing_timeout:${testRequestId}`), 20, vitest_1.expect.any(String));
        });
    });
    (0, vitest_1.describe)('Data Flow Between Agents', () => {
        (0, vitest_1.it)('should properly pass data between agents', async () => {
            // Test that each agent stores its results for the next agent
            mockEvent = {
                httpMethod: 'POST',
                body: JSON.stringify({ requestId: testRequestId }),
                headers: { 'X-Internal-Token': 'mock-internal-key' },
                multiValueHeaders: {},
                isBase64Encoded: false,
                path: '/research',
                queryStringParameters: {},
                multiValueQueryStringParameters: {},
                rawUrl: 'http://localhost/.netlify/functions/test',
                rawQuery: '',
            };
            await (0, research_1.handler)(mockEvent);
            // Verify research results were stored
            (0, vitest_1.expect)(mockRedis.setex).toHaveBeenCalledWith(`research_results:${testRequestId}`, 3600, vitest_1.expect.any(String));
            await (0, curation_1.handler)(mockEvent);
            // Verify curation results were stored
            (0, vitest_1.expect)(mockRedis.setex).toHaveBeenCalledWith(`curation_results:${testRequestId}`, 3600, vitest_1.expect.any(String));
        });
    });
});

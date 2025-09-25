import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { HandlerEvent } from '@netlify/functions';
import {
  ItineraryRequest,
  ProcessingStatus,
  UserRequirements,
} from '@swift-travel/shared';
import { v4 as uuidv4 } from 'uuid';

// Mock all dependencies
vi.mock('@upstash/redis', () => ({
  Redis: vi.fn().mockImplementation(() => ({
    get: vi.fn(),
    set: vi.fn(),
    setex: vi.fn(),
    del: vi.fn(),
  })),
}));

vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
  })),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({
      insert: vi.fn().mockReturnValue({ error: null }),
      select: () => ({
        eq: () => ({
          single: vi.fn(),
        }),
      }),
    }),
  }),
}));

vi.mock('@swift-travel/shared/config', () => ({
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
global.fetch = vi.fn();

// Import handlers after mocking dependencies
import { handler as processRequestHandler } from '../../itineraries/process-request';
import { handler as researchHandler } from '../../agents/research';
import { handler as curationHandler } from '../../agents/curation';
import { handler as validationHandler } from '../../agents/validation';
import { handler as responseHandler } from '../../agents/response';

describe('Agent Pipeline Integration Tests', () => {
  let mockRedis: any;
  let mockOpenAI: any;
  let mockEvent: HandlerEvent;
  // let mockContext: Context;
  let testRequestId: string;
  let mockItineraryRequest: ItineraryRequest;

  beforeEach(() => {
    vi.clearAllMocks();

    testRequestId = uuidv4();

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
        duration: 'long-weekend' as const,
        travelerComposition: { adults: 2, children: 0, childrenAges: [] },
        groupSize: 2,
        specialRequests: ['romantic spots'],
        accessibilityNeeds: [],
      } as UserRequirements,
      processingLog: [],
      status: 'initiated' as ProcessingStatus,
      errorDetails: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Setup Redis mock
    mockRedis = {
      get: vi.fn(),
      set: vi.fn(),
      setex: vi.fn(),
      del: vi.fn(),
    } as any;

    mockRedis.get.mockImplementation((key: string) => {
      if (key === `itinerary_request:${testRequestId}`) {
        return Promise.resolve(JSON.stringify(mockItineraryRequest));
      }
      if (key.startsWith('research_results:')) {
        return Promise.resolve(
          JSON.stringify({
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
          })
        );
      }
      if (key.startsWith('curation_results:')) {
        return Promise.resolve(
          JSON.stringify({
            activities: [
              {
                id: uuidv4(),
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
          })
        );
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
          create: vi.fn(),
        },
      },
    } as any;

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
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          status: 'OK',
          results: [
            {
              place_id: 'test-place-id',
              name: 'Eiffel Tower',
              formatted_address:
                'Champ de Mars, 5 Avenue Anatole France, 75007 Paris, France',
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

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete Pipeline Flow', () => {
    it('should process complete agent pipeline successfully', async () => {
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

      const processResponse = await processRequestHandler(mockEvent);
      expect(processResponse.statusCode).toBe(200);
      const processData = JSON.parse(processResponse.body);
      expect(processData.success).toBe(true);
      expect(processData.data.status).toBe('research-in-progress');

      // 2. Research Agent
      mockEvent.body = JSON.stringify({ requestId: testRequestId });
      const researchResponse = await researchHandler(mockEvent);
      expect(researchResponse.statusCode).toBe(200);
      const researchData = JSON.parse(researchResponse.body);
      expect(researchData.success).toBe(true);
      expect(researchData.data.status).toBe('research-completed');

      // 3. Curation Agent
      const curationResponse = await curationHandler(mockEvent);
      expect(curationResponse.statusCode).toBe(200);
      const curationData = JSON.parse(curationResponse.body);
      expect(curationData.success).toBe(true);
      expect(curationData.data.status).toBe('curation-completed');

      // 4. Validation Agent
      const validationResponse = await validationHandler(mockEvent);
      expect(validationResponse.statusCode).toBe(200);
      const validationData = JSON.parse(validationResponse.body);
      expect(validationData.success).toBe(true);
      expect(validationData.data.status).toBe('validation-completed');

      // 5. Response Agent
      const responseResponse = await responseHandler(mockEvent);
      expect(responseResponse.statusCode).toBe(200);
      const responseData = JSON.parse(responseResponse.body);
      expect(responseData.success).toBe(true);
      expect(responseData.data.status).toBe('completed');

      // Verify Redis calls
      expect(mockRedis.get).toHaveBeenCalledWith(
        `itinerary_request:${testRequestId}`
      );
      expect(mockRedis.setex).toHaveBeenCalled();
    });

    it('should handle missing request gracefully', async () => {
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

      const response = await researchHandler(mockEvent);
      expect(response.statusCode).toBe(500);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(false);
      expect(data.error.message).toContain('failed');
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle OpenAI API failures gracefully', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(
        new Error('OpenAI API Error')
      );

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

      const response = await researchHandler(mockEvent);
      expect(response.statusCode).toBe(500);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(false);
      expect(data.error.message).toContain('failed');
    });

    it('should handle Google Places API failures gracefully', async () => {
      (global.fetch as any).mockResolvedValue({
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
      const response = await validationHandler(mockEvent);
      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
    });

    it('should handle Redis connection failures', async () => {
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

      const response = await researchHandler(mockEvent);
      expect(response.statusCode).toBe(500);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(false);
    });
  });

  describe('Authentication and Security', () => {
    it('should reject requests without internal token', async () => {
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

      const response = await researchHandler(mockEvent);
      expect(response.statusCode).toBe(500);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(false);
    });

    it('should reject requests with invalid internal token', async () => {
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

      const response = await researchHandler(mockEvent);
      expect(response.statusCode).toBe(500);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(false);
    });
  });

  describe('Processing Time Monitoring', () => {
    it('should set timeout monitoring for requests', async () => {
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

      const response = await processRequestHandler(mockEvent);
      expect(response.statusCode).toBe(200);

      // Verify timeout monitoring was set
      expect(mockRedis.setex).toHaveBeenCalledWith(
        expect.stringContaining(`processing_timeout:${testRequestId}`),
        20,
        expect.any(String)
      );
    });
  });

  describe('Data Flow Between Agents', () => {
    it('should properly pass data between agents', async () => {
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

      await researchHandler(mockEvent);

      // Verify research results were stored
      expect(mockRedis.setex).toHaveBeenCalledWith(
        `research_results:${testRequestId}`,
        3600,
        expect.any(String)
      );

      await curationHandler(mockEvent);

      // Verify curation results were stored
      expect(mockRedis.setex).toHaveBeenCalledWith(
        `curation_results:${testRequestId}`,
        3600,
        expect.any(String)
      );
    });
  });
});

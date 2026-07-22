import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  CreateItineraryRequest,
  ProcessingStatusData,
  AgentRequest,
  apiSuccess,
  apiError,
} from '@swift-travel/shared/schemas/api';
import type { UserRequirements } from '@swift-travel/shared/types';

// ── Shared mock objects (vi.hoisted ensures they exist when vi.mock factories run) ──
const { sharedRedis, sharedOpenAI } = vi.hoisted(() => ({
  sharedRedis: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
    setex: vi.fn().mockResolvedValue('OK'),
    del: vi.fn().mockResolvedValue(1),
  },
  sharedOpenAI: {
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{ message: { content: '{}' } }],
        }),
      },
    },
  },
}));

// ── Mocks ────────────────────────────────────────────────────────────
vi.mock('@upstash/redis', () => ({
  Redis: vi.fn().mockImplementation(() => sharedRedis),
}));

vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => sharedOpenAI),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({
      insert: vi.fn().mockReturnValue({ error: null }),
      select: () => ({ eq: () => ({ single: vi.fn() }) }),
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
    database: { url: 'mock://supabase', serviceRoleKey: 'mock-service-key' },
    frontend: { baseUrl: 'http://localhost:8888/.netlify/functions' },
  },
}));

vi.mock('../../shared/auth', () => ({
  requireInternalAuth: vi.fn().mockReturnValue(true),
}));

vi.mock('../../shared/response', () => ({
  createErrorResponse: (code: number, message: string, details?: any) => ({
    statusCode: code,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      success: false,
      error: { message, details },
      timestamp: new Date().toISOString(),
    }),
  }),
  createSuccessResponse: (data: any, code = 200) => ({
    statusCode: code,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    }),
  }),
}));

vi.mock('../../shared/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
  agentLogger: {
    agentStart: vi.fn(),
    agentComplete: vi.fn(),
    agentError: vi.fn(),
    orchestrationEvent: vi.fn(),
  },
}));

global.fetch = vi
  .fn()
  .mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ success: true }),
  });

// ── Imports after mocks ──────────────────────────────────────────────
import { handler as processRequestHandler } from '../../itineraries/process-request';
import { handler as statusHandler } from '../../itineraries/status';
import { handler as researchHandler } from '../../agents/research';
import { handler as curationHandler } from '../../agents/curation';
import { handler as validationHandler } from '../../agents/validation';
import { handler as responseHandler } from '../../agents/response';
import { v4 as uuidv4 } from 'uuid';

// ── Test fixtures ────────────────────────────────────────────────────
const VALID_REQUIREMENTS: UserRequirements = {
  destination: 'Portland, OR',
  interests: ['food', 'art', 'outdoors'],
  duration: 'long-weekend',
  groupSize: 2,
  travelerComposition: { adults: 2, children: 0, childrenAges: [] },
  specialRequests: [],
  accessibilityNeeds: [],
};

const RESEARCH_RESULT = {
  destination: {
    name: 'Portland',
    city: 'Portland',
    region: 'Oregon',
    country: 'USA',
    timeZone: 'America/Los_Angeles',
    coordinates: { lat: 45.5152, lng: -122.6784 },
  },
  contextData: {
    culture: ["Powell's Books", 'Alberta Arts District'],
    cuisine: ['Food carts', 'Farm-to-table dining'],
    attractions: ['Japanese Garden', 'Washington Park'],
    neighborhoods: ['Pearl District', 'Alberta', 'Hawthorne'],
    transportation: ['MAX Light Rail', 'Biketown'],
    longWeekendHighlights: ['3-day food crawl', 'Gallery walk'],
  },
  interestRecommendations: {
    food: {
      focus: ['Food carts', 'Craft beer'],
      recommendations: ['Pine State Biscuits'],
      tips: ['Cash at food carts'],
    },
    art: {
      focus: ['Street art', 'Galleries'],
      recommendations: ['Portland Art Museum'],
      tips: ['First Thursday free'],
    },
    outdoors: {
      focus: ['Forests', 'Parks'],
      recommendations: ['Forest Park'],
      tips: ['Pack rain gear'],
    },
  },
  researchSources: ['Local blogs'],
  confidence: 0.92,
};

const CURATION_RESULT = {
  activities: [
    {
      id: uuidv4(),
      itineraryId: '',
      name: 'Pine State Biscuits',
      description: 'Famous Portland biscuits',
      category: 'food',
      timing: {
        dayNumber: 1,
        startTime: '09:00',
        duration: 60,
        flexibility: 'flexible',
        bufferTime: 15,
      },
      location: {
        name: 'Pine State Biscuits',
        address: '1001 SE Division St, Portland, OR',
        coordinates: { lat: 45.5055, lng: -122.6538 },
        neighborhood: 'Division',
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
        confidence: 0,
        googlePlaceId: null,
        issues: [],
        lastUpdated: new Date(),
      },
      personaContext: {
        reasoning: 'Top food pick',
        highlights: ['Biscuits'],
        tips: ['Go early'],
      },
    },
    {
      id: uuidv4(),
      itineraryId: '',
      name: 'Portland Art Museum',
      description: 'Pacific Northwest art collection',
      category: 'sightseeing',
      timing: {
        dayNumber: 1,
        startTime: '11:00',
        duration: 120,
        flexibility: 'flexible',
        bufferTime: 30,
      },
      location: {
        name: 'Portland Art Museum',
        address: '1219 SW Park Ave, Portland, OR',
        coordinates: { lat: 45.5202, lng: -122.6831 },
        neighborhood: 'Downtown',
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
        confidence: 0,
        googlePlaceId: null,
        issues: [],
        lastUpdated: new Date(),
      },
      personaContext: {
        reasoning: 'Art interest match',
        highlights: ['Northwest art'],
        tips: ['Free on First Thursday'],
      },
    },
  ],
  itineraryOverview: {
    totalActivities: 2,
    estimatedCost: { min: 40, max: 120, currency: 'USD' },
    themes: ['Food & Art'],
    highlights: ['Biscuits and galleries'],
  },
  curationMetadata: {
    interestAlignment: 0.93,
    logisticalScore: 0.88,
    diversityScore: 0.82,
  },
};

// ── API Contract Tests ───────────────────────────────────────────────
describe('API Contract — Zod schema validation', () => {
  describe('CreateItineraryRequest', () => {
    it('accepts valid requirements', () => {
      const result = CreateItineraryRequest.safeParse({
        requirements: VALID_REQUIREMENTS,
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty destination', () => {
      const result = CreateItineraryRequest.safeParse({
        requirements: { ...VALID_REQUIREMENTS, destination: '' },
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty interests', () => {
      const result = CreateItineraryRequest.safeParse({
        requirements: { ...VALID_REQUIREMENTS, interests: [] },
      });
      expect(result.success).toBe(false);
    });

    it('rejects groupSize of 0', () => {
      const result = CreateItineraryRequest.safeParse({
        requirements: { ...VALID_REQUIREMENTS, groupSize: 0 },
      });
      expect(result.success).toBe(false);
    });

    it('rejects groupSize > 20', () => {
      const result = CreateItineraryRequest.safeParse({
        requirements: { ...VALID_REQUIREMENTS, groupSize: 21 },
      });
      expect(result.success).toBe(false);
    });

    it('rejects > 12 interests', () => {
      const result = CreateItineraryRequest.safeParse({
        requirements: {
          ...VALID_REQUIREMENTS,
          interests: Array(13).fill('food'),
        },
      });
      expect(result.success).toBe(false);
    });

    it('defaults duration to long-weekend', () => {
      const { duration } = CreateItineraryRequest.parse({
        requirements: VALID_REQUIREMENTS,
      }).requirements;
      expect(duration).toBe('long-weekend');
    });

    it('defaults specialRequests and accessibilityNeeds to []', () => {
      const req = CreateItineraryRequest.parse({
        requirements: VALID_REQUIREMENTS,
      }).requirements;
      expect(req.specialRequests).toEqual([]);
      expect(req.accessibilityNeeds).toEqual([]);
    });
  });

  describe('ProcessingStatusData', () => {
    it('validates a complete status response', () => {
      const status = ProcessingStatusData.parse({
        requestId: uuidv4(),
        itineraryId: null,
        status: 'research-in-progress',
        progress: 10,
        currentAgent: 'research',
        estimatedTimeRemaining: 54,
        error: null,
      });
      expect(status.progress).toBe(10);
      expect(status.currentAgent).toBe('research');
    });

    it('rejects invalid status value', () => {
      expect(() =>
        ProcessingStatusData.parse({
          requestId: uuidv4(),
          itineraryId: null,
          status: 'bogus-status',
          progress: 50,
          currentAgent: null,
          estimatedTimeRemaining: 30,
        })
      ).toThrow();
    });
  });

  describe('AgentRequest', () => {
    it('requires a valid UUID', () => {
      expect(AgentRequest.safeParse({ requestId: 'not-a-uuid' }).success).toBe(
        false
      );
      expect(AgentRequest.safeParse({ requestId: uuidv4() }).success).toBe(
        true
      );
    });
  });

  describe('apiSuccess / apiError envelopes', () => {
    it('apiSuccess wraps data correctly', () => {
      const res = apiSuccess({ foo: 'bar' });
      expect(res.success).toBe(true);
      expect(res.data.foo).toBe('bar');
      expect(res.timestamp).toBeTruthy();
    });

    it('apiError wraps error correctly', () => {
      const res = apiError('VALIDATION', 'bad input');
      expect(res.success).toBe(false);
      expect(res.error.code).toBe('VALIDATION');
    });
  });
});

// ── Vertical Slice: Full pipeline flow ───────────────────────────────
describe('Vertical Slice — Submit → Status → Pipeline → Done', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Re-setup shared mock defaults after clearAllMocks
    sharedRedis.get.mockResolvedValue(null);
    sharedRedis.set.mockResolvedValue('OK');
    sharedRedis.setex.mockResolvedValue('OK');
    sharedRedis.del.mockResolvedValue(1);
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
    sharedOpenAI.chat.completions.create.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(RESEARCH_RESULT) } }],
    });
  });

  it('step 1: POST requirements → 202 accepted', async () => {
    const response = await processRequestHandler({
      httpMethod: 'POST',
      body: JSON.stringify({ requirements: VALID_REQUIREMENTS }),
      headers: {},
      multiValueHeaders: {},
      isBase64Encoded: false,
      path: '/process-request',
      queryStringParameters: {},
      multiValueQueryStringParameters: {},
      rawUrl: '',
      rawQuery: '',
    } as any);

    expect(response.statusCode).toBe(202);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('research-in-progress');

    // Verify the request was stored in Redis
    expect(sharedRedis.set).toHaveBeenCalledWith(
      expect.stringMatching(/^itinerary_request:/),
      expect.any(String),
      expect.objectContaining({ ex: 3600 })
    );
  });

  it('step 2: GET status → valid ProcessingStatusData', async () => {
    const testId = uuidv4();
    const mockRequest = {
      id: testId,
      itineraryId: null,
      status: 'research-in-progress',
      processingLog: [],
      errorDetails: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      requirements: {
        ...VALID_REQUIREMENTS,
        dates: {
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 86400000 * 3).toISOString(),
        },
      },
    };

    sharedRedis.get.mockImplementation((key: string) => {
      if (key === `itinerary_request:${testId}`)
        return Promise.resolve(JSON.stringify(mockRequest));
      return Promise.resolve(null);
    });

    const response = await (statusHandler as any)({
      httpMethod: 'GET',
      body: null,
      headers: {},
      multiValueHeaders: {},
      isBase64Encoded: false,
      path: '/status',
      queryStringParameters: { requestId: testId },
      multiValueQueryStringParameters: {},
      rawUrl: '',
      rawQuery: '',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);

    // Validate against contract
    const validated = ProcessingStatusData.parse(body.data);
    expect(validated.status).toBe('research-in-progress');
    expect(validated.progress).toBe(10);
    expect(validated.currentAgent).toBe('research');
    expect(validated.estimatedTimeRemaining).toBeGreaterThan(0);
  });

  it('step 3: pipeline runs research → curation → validation → response', async () => {
    const testId = uuidv4();
    const mockRequest: any = {
      id: testId,
      userId: 'test-user',
      itineraryId: null,
      requirements: {
        ...VALID_REQUIREMENTS,
        dates: {
          startDate: new Date(),
          endDate: new Date(Date.now() + 86400000 * 3),
        },
      },
      status: 'research-in-progress',
      processingLog: [],
      errorDetails: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // In-memory store for Redis data between agent calls
    const storedData: Record<string, string> = {};

    sharedRedis.get.mockImplementation((key: string) => {
      if (key === `itinerary_request:${testId}`) {
        return Promise.resolve(JSON.stringify(mockRequest));
      }
      return Promise.resolve(storedData[key] || null);
    });

    sharedRedis.setex.mockImplementation(
      (key: string, _ttl: number, val: string) => {
        storedData[key] = val;
        return Promise.resolve('OK');
      }
    );

    sharedRedis.set.mockImplementation((key: string, val: string) => {
      storedData[key] = typeof val === 'string' ? val : JSON.stringify(val);
      return Promise.resolve('OK');
    });

    // Step 3a: Research
    sharedOpenAI.chat.completions.create.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(RESEARCH_RESULT) } }],
    });
    const researchRes = await researchHandler({
      httpMethod: 'POST',
      body: JSON.stringify({ requestId: testId }),
      headers: { 'x-internal-token': 'mock-internal-key' },
      multiValueHeaders: {},
      isBase64Encoded: false,
      path: '/research',
      queryStringParameters: {},
      multiValueQueryStringParameters: {},
      rawUrl: '',
      rawQuery: '',
    } as any);

    expect(researchRes.statusCode).toBe(200);
    const researchBody = JSON.parse(researchRes.body);
    expect(researchBody.data.status).toBe('research-completed');

    // Step 3b: Curation
    mockRequest.status = 'curation-in-progress';
    sharedOpenAI.chat.completions.create.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(CURATION_RESULT) } }],
    });
    const curationRes = await curationHandler({
      httpMethod: 'POST',
      body: JSON.stringify({ requestId: testId }),
      headers: { 'x-internal-token': 'mock-internal-key' },
      multiValueHeaders: {},
      isBase64Encoded: false,
      path: '/curation',
      queryStringParameters: {},
      multiValueQueryStringParameters: {},
      rawUrl: '',
      rawQuery: '',
    } as any);

    expect(curationRes.statusCode).toBe(200);
    const curationBody = JSON.parse(curationRes.body);
    expect(curationBody.data.status).toBe('curation-completed');

    // Step 3c: Validation
    mockRequest.status = 'validation-in-progress';
    // Mock fetch for Google Places
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          status: 'OK',
          results: [
            {
              place_id: 'verified-place-id',
              name: 'Pine State Biscuits',
              formatted_address: '1001 SE Division St, Portland, OR 97202',
              geometry: { location: { lat: 45.5055, lng: -122.6538 } },
              rating: 4.5,
              types: ['restaurant'],
              business_status: 'OPERATIONAL',
            },
          ],
        }),
    });

    const validationRes = await validationHandler({
      httpMethod: 'POST',
      body: JSON.stringify({ requestId: testId }),
      headers: { 'x-internal-token': 'mock-internal-key' },
      multiValueHeaders: {},
      isBase64Encoded: false,
      path: '/validation',
      queryStringParameters: {},
      multiValueQueryStringParameters: {},
      rawUrl: '',
      rawQuery: '',
    } as any);

    expect(validationRes.statusCode).toBe(200);
    const validationBody = JSON.parse(validationRes.body);
    expect(validationBody.data.status).toBe('validation-completed');

    // Step 3d: Response
    mockRequest.status = 'response-in-progress';
    const responseRes = await responseHandler({
      httpMethod: 'POST',
      body: JSON.stringify({ requestId: testId }),
      headers: { 'x-internal-token': 'mock-internal-key' },
      multiValueHeaders: {},
      isBase64Encoded: false,
      path: '/response',
      queryStringParameters: {},
      multiValueQueryStringParameters: {},
      rawUrl: '',
      rawQuery: '',
    } as any);

    expect(responseRes.statusCode).toBe(200);
    const responseBody = JSON.parse(responseRes.body);
    expect(responseBody.data.status).toBe('completed');
    expect(responseBody.data.itinerary.id).toBeTruthy();
    expect(responseBody.data.itinerary.activities).toBe(2);

    // Verify all agents stored their results
    expect(storedData[`research_results:${testId}`]).toBeTruthy();
    expect(storedData[`curation_results:${testId}`]).toBeTruthy();
    expect(storedData[`validation_results:${testId}`]).toBeTruthy();
  });
});

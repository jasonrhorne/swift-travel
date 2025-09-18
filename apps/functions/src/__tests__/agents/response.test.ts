import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ItineraryRequest, ProcessingStatus } from '@swift-travel/shared';

// Mock dependencies
vi.mock('@upstash/redis', () => ({
  Redis: vi.fn().mockImplementation(() => ({
    get: vi.fn(),
    set: vi.fn(),
    setex: vi.fn()
  }))
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn()
}));

vi.mock('@swift-travel/shared/config', () => ({
  config: {
    redis: { url: 'mock://redis', token: 'mock-token' },
    api: { internalApiKey: 'mock-internal' },
    database: {
      url: 'mock://supabase',
      serviceRoleKey: 'mock-service-key'
    }
  }
}));

vi.mock('../../shared/auth', () => ({
  requireInternalAuth: vi.fn().mockResolvedValue(true)
}));

vi.mock('../../shared/response', () => ({
  createErrorResponse: vi.fn((code, message, data) => ({ statusCode: code, body: JSON.stringify({ error: message, data }) })),
  createSuccessResponse: vi.fn((data) => ({ statusCode: 200, body: JSON.stringify({ success: true, data }) }))
}));

vi.mock('../../shared/logger', () => ({
  agentLogger: {
    agentStart: vi.fn(),
    agentComplete: vi.fn(),
    agentError: vi.fn(),
    orchestrationEvent: vi.fn(),
    timeout: vi.fn()
  }
}));

vi.mock('../../itineraries/process-request', () => ({
  getItineraryRequest: vi.fn(),
  saveItineraryRequest: vi.fn(),
  completeAgentProcessing: vi.fn(),
  handleAgentFailure: vi.fn()
}));

import { handler } from '../../agents/response';

describe('Response Agent Unit Tests', () => {
  let mockItineraryRequest: ItineraryRequest;
  let mockResearchResults: any;
  let mockCurationResults: any;
  let mockValidationResults: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockItineraryRequest = {
      id: 'test-request-id',
      userId: 'test-user',
      itineraryId: null,
      requirements: {
        destination: 'Paris, France',
        persona: 'photography',
        dates: {
          startDate: new Date('2024-06-01'),
          endDate: new Date('2024-06-05')
        },
        budgetRange: 'mid-range',
        groupSize: 2,
        specialRequests: [],
        accessibilityNeeds: []
      },
      status: 'response-in-progress' as ProcessingStatus,
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

  it('should successfully generate final response and store itinerary', async () => {
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
    const { getItineraryRequest } = await import('../../itineraries/process-request');
    const { Redis } = await import('@upstash/redis');
    const { createClient } = await import('@supabase/supabase-js');

    vi.mocked(getItineraryRequest).mockResolvedValue(mockItineraryRequest);
    
    const mockRedis = {
      get: vi.fn()
        .mockResolvedValueOnce(JSON.stringify(mockResearchResults))    // Research results
        .mockResolvedValueOnce(JSON.stringify(mockCurationResults))     // Curation results
        .mockResolvedValueOnce(JSON.stringify(mockValidationResults)),  // Validation results
      setex: vi.fn().mockResolvedValue('OK')
    };
    vi.mocked(Redis).mockImplementation(() => mockRedis as any);

    const mockSupabase = {
      from: vi.fn(() => ({
        insert: vi.fn().mockResolvedValue({ 
          error: null, 
          data: [{ id: 'itinerary-123' }] 
        })
      }))
    };
    vi.mocked(createClient).mockReturnValue(mockSupabase as any);

    // Act
    const response = await handler(mockEvent);

    // Assert
    expect(response.statusCode).toBe(200);
    const responseData = JSON.parse(response.body);
    expect(responseData.success).toBe(true);
    expect(responseData.data.status).toBe('completed');
    
    // Verify itinerary was stored
    expect(mockSupabase.from).toHaveBeenCalledWith('itineraries');
    
    // Verify response results were stored in Redis
    expect(mockRedis.setex).toHaveBeenCalledWith(
      'response_results:test-request-id',
      3600,
      expect.stringContaining('totalDuration')
    );
  });

  it('should handle missing agent results gracefully', async () => {
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
    const { getItineraryRequest } = await import('../../itineraries/process-request');
    const { Redis } = await import('@upstash/redis');

    vi.mocked(getItineraryRequest).mockResolvedValue(mockItineraryRequest);
    
    const mockRedis = {
      get: vi.fn()
        .mockResolvedValueOnce(null)  // Missing research results
        .mockResolvedValueOnce(JSON.stringify(mockCurationResults))
        .mockResolvedValueOnce(JSON.stringify(mockValidationResults)),
      setex: vi.fn()
    };
    vi.mocked(Redis).mockImplementation(() => mockRedis as any);

    // Act
    const response = await handler(mockEvent);

    // Assert
    expect(response.statusCode).toBe(400);
    const responseData = JSON.parse(response.body);
    expect(responseData.error).toContain('Missing agent results');
  });

  it('should handle database storage errors', async () => {
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
    const { getItineraryRequest, handleAgentFailure } = await import('../../itineraries/process-request');
    const { Redis } = await import('@upstash/redis');
    const { createClient } = await import('@supabase/supabase-js');

    vi.mocked(getItineraryRequest).mockResolvedValue(mockItineraryRequest);
    
    const mockRedis = {
      get: vi.fn()
        .mockResolvedValueOnce(JSON.stringify(mockResearchResults))
        .mockResolvedValueOnce(JSON.stringify(mockCurationResults))
        .mockResolvedValueOnce(JSON.stringify(mockValidationResults)),
      setex: vi.fn()
    };
    vi.mocked(Redis).mockImplementation(() => mockRedis as any);

    const mockSupabase = {
      from: vi.fn(() => ({
        insert: vi.fn().mockResolvedValue({ 
          error: { message: 'Database error' }, 
          data: null 
        })
      }))
    };
    vi.mocked(createClient).mockReturnValue(mockSupabase as any);

    // Act
    const response = await handler(mockEvent);

    // Assert
    expect(response.statusCode).toBe(500);
    expect(handleAgentFailure).toHaveBeenCalledWith(
      'test-request-id',
      'response',
      expect.any(Error)
    );
  });

  it('should calculate quality scores correctly', async () => {
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
    const { getItineraryRequest } = await import('../../itineraries/process-request');
    const { Redis } = await import('@upstash/redis');
    const { createClient } = await import('@supabase/supabase-js');

    vi.mocked(getItineraryRequest).mockResolvedValue(mockItineraryRequest);
    
    const mockRedis = {
      get: vi.fn()
        .mockResolvedValueOnce(JSON.stringify(mockResearchResults))
        .mockResolvedValueOnce(JSON.stringify(mockCurationResults))
        .mockResolvedValueOnce(JSON.stringify(highQualityValidationResults)),
      setex: vi.fn().mockResolvedValue('OK')
    };
    vi.mocked(Redis).mockImplementation(() => mockRedis as any);

    const mockSupabase = {
      from: vi.fn(() => ({
        insert: vi.fn().mockResolvedValue({ 
          error: null, 
          data: [{ id: 'itinerary-123' }] 
        })
      }))
    };
    vi.mocked(createClient).mockReturnValue(mockSupabase as any);

    // Act
    const response = await handler(mockEvent);

    // Assert
    expect(response.statusCode).toBe(200);
    const responseData = JSON.parse(response.body);
    expect(responseData.success).toBe(true);
    
    // Quality score should be calculated based on validation confidence and persona adherence
    const storedResponse = JSON.parse(mockRedis.setex.mock.calls[0][2]);
    expect(storedResponse.qualityScore).toBeGreaterThan(0.8);
  });

  it('should handle missing request ID', async () => {
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
    const response = await handler(mockEvent);

    // Assert
    expect(response.statusCode).toBe(400);
    const responseData = JSON.parse(response.body);
    expect(responseData.error).toContain('Missing requestId');
  });

  it('should calculate processing metrics correctly', async () => {
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
    const { getItineraryRequest } = await import('../../itineraries/process-request');
    const { Redis } = await import('@upstash/redis');
    const { createClient } = await import('@supabase/supabase-js');

    vi.mocked(getItineraryRequest).mockResolvedValue(mockItineraryRequest);
    
    const mockRedis = {
      get: vi.fn()
        .mockResolvedValueOnce(JSON.stringify(mockResearchResults))
        .mockResolvedValueOnce(JSON.stringify(mockCurationResults))
        .mockResolvedValueOnce(JSON.stringify(mockValidationResults)),
      setex: vi.fn().mockResolvedValue('OK')
    };
    vi.mocked(Redis).mockImplementation(() => mockRedis as any);

    const mockSupabase = {
      from: vi.fn(() => ({
        insert: vi.fn().mockResolvedValue({ 
          error: null, 
          data: [{ id: 'itinerary-123' }] 
        })
      }))
    };
    vi.mocked(createClient).mockReturnValue(mockSupabase as any);

    // Act
    const response = await handler(mockEvent);

    // Assert
    expect(response.statusCode).toBe(200);
    
    // Verify processing metrics were calculated
    const storedResponse = JSON.parse(mockRedis.setex.mock.calls[0][2]);
    expect(storedResponse.totalDuration).toBeDefined();
    expect(storedResponse.agentDurations).toBeDefined();
    expect(storedResponse.agentDurations.research).toBe(120000); // 2 minutes
    expect(storedResponse.agentDurations.curation).toBe(180000); // 3 minutes
    expect(storedResponse.agentDurations.validation).toBe(120000); // 2 minutes
  });
});
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Context } from '@netlify/functions';
import { ItineraryRequest, ProcessingStatus } from '@swift-travel/shared';

// Mock dependencies
vi.mock('@upstash/redis', () => ({
  Redis: vi.fn().mockImplementation(() => ({
    get: vi.fn(),
    set: vi.fn(),
    setex: vi.fn()
  }))
}));

vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn()
      }
    }
  }))
}));

vi.mock('@swift-travel/shared/config', () => ({
  config: {
    redis: { url: 'mock://redis', token: 'mock-token' },
    api: { openaiApiKey: 'mock-key', internalApiKey: 'mock-internal' }
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

import { handler } from '../../agents/curation';

describe('Curation Agent Unit Tests', () => {
  let mockContext: Context;
  let mockItineraryRequest: ItineraryRequest;
  let mockResearchResults: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockContext = {} as Context;
    
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
      status: 'curation-in-progress' as ProcessingStatus,
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

  it('should successfully process curation request with valid research results', async () => {
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
    const { getItineraryRequest } = await import('../../itineraries/process-request');
    const { Redis } = await import('@upstash/redis');
    const OpenAI = (await import('openai')).default;

    vi.mocked(getItineraryRequest).mockResolvedValue(mockItineraryRequest);
    
    const mockRedis = {
      get: vi.fn().mockResolvedValue(JSON.stringify(mockResearchResults)),
      setex: vi.fn().mockResolvedValue('OK')
    };
    vi.mocked(Redis).mockImplementation(() => mockRedis as any);

    const mockOpenAI = {
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [{
              message: {
                content: JSON.stringify(mockCurationResults)
              }
            }]
          })
        }
      }
    };
    vi.mocked(OpenAI).mockImplementation(() => mockOpenAI as any);

    // Act
    const response = await handler(mockEvent, mockContext);

    // Assert
    expect(response.statusCode).toBe(200);
    const responseData = JSON.parse(response.body);
    expect(responseData.success).toBe(true);
    expect(responseData.data.status).toBe('curation-completed');
    expect(mockRedis.setex).toHaveBeenCalledWith(
      'curation_results:test-request-id',
      3600,
      JSON.stringify(mockCurationResults)
    );
  });

  it('should handle missing research results', async () => {
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
    const { getItineraryRequest } = await import('../../itineraries/process-request');
    const { Redis } = await import('@upstash/redis');

    vi.mocked(getItineraryRequest).mockResolvedValue(mockItineraryRequest);
    
    const mockRedis = {
      get: vi.fn().mockResolvedValue(null), // No research results
      setex: vi.fn()
    };
    vi.mocked(Redis).mockImplementation(() => mockRedis as any);

    // Act
    const response = await handler(mockEvent, mockContext);

    // Assert
    expect(response.statusCode).toBe(400);
    const responseData = JSON.parse(response.body);
    expect(responseData.error).toContain('research results not found');
  });

  it('should handle invalid curation output format', async () => {
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
    const { getItineraryRequest } = await import('../../itineraries/process-request');
    const { Redis } = await import('@upstash/redis');
    const OpenAI = (await import('openai')).default;

    vi.mocked(getItineraryRequest).mockResolvedValue(mockItineraryRequest);
    
    const mockRedis = {
      get: vi.fn().mockResolvedValue(JSON.stringify(mockResearchResults)),
      setex: vi.fn()
    };
    vi.mocked(Redis).mockImplementation(() => mockRedis as any);

    const mockOpenAI = {
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [{
              message: {
                content: 'Invalid JSON response'
              }
            }]
          })
        }
      }
    };
    vi.mocked(OpenAI).mockImplementation(() => mockOpenAI as any);

    // Act
    const response = await handler(mockEvent, mockContext);

    // Assert
    expect(response.statusCode).toBe(500);
    const responseData = JSON.parse(response.body);
    expect(responseData.error).toContain('Error processing curation request');
  });

  it('should validate activity structure in curation results', async () => {
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
    const { getItineraryRequest } = await import('../../itineraries/process-request');
    const { Redis } = await import('@upstash/redis');
    const OpenAI = (await import('openai')).default;

    vi.mocked(getItineraryRequest).mockResolvedValue(mockItineraryRequest);
    
    const mockRedis = {
      get: vi.fn().mockResolvedValue(JSON.stringify(mockResearchResults)),
      setex: vi.fn()
    };
    vi.mocked(Redis).mockImplementation(() => mockRedis as any);

    const mockOpenAI = {
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [{
              message: {
                content: JSON.stringify(invalidCurationResults)
              }
            }]
          })
        }
      }
    };
    vi.mocked(OpenAI).mockImplementation(() => mockOpenAI as any);

    // Act
    const response = await handler(mockEvent, mockContext);

    // Assert
    expect(response.statusCode).toBe(500);
    const responseData = JSON.parse(response.body);
    expect(responseData.error).toContain('Error processing curation request');
  });

  it('should handle request ID missing from body', async () => {
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
    const response = await handler(mockEvent, mockContext);

    // Assert
    expect(response.statusCode).toBe(400);
    const responseData = JSON.parse(response.body);
    expect(responseData.error).toContain('Missing requestId');
  });
});
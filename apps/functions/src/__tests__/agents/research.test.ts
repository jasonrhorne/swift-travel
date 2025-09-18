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

import { handler } from '../../agents/research';

describe('Research Agent Unit Tests', () => {
  let mockItineraryRequest: ItineraryRequest;

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
      status: 'research-in-progress' as ProcessingStatus,
      processingLog: [],
      errorDetails: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  });

  it('should successfully process research request with valid input', async () => {
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
    const { getItineraryRequest } = await import('../../itineraries/process-request');
    const { Redis } = await import('@upstash/redis');
    const OpenAI = (await import('openai')).default;

    vi.mocked(getItineraryRequest).mockResolvedValue(mockItineraryRequest);
    
    const mockRedis = {
      setex: vi.fn().mockResolvedValue('OK')
    };
    vi.mocked(Redis).mockImplementation(() => mockRedis as any);

    const mockOpenAI = {
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [{
              message: {
                content: JSON.stringify(mockResearchResults)
              }
            }]
          })
        }
      }
    };
    vi.mocked(OpenAI).mockImplementation(() => mockOpenAI as any);

    // Act
    const response = await handler(mockEvent);

    // Assert
    expect(response.statusCode).toBe(200);
    const responseData = JSON.parse(response.body);
    expect(responseData.success).toBe(true);
    expect(responseData.data.status).toBe('research-completed');
    expect(mockRedis.setex).toHaveBeenCalledWith(
      'research_results:test-request-id',
      3600,
      JSON.stringify(mockResearchResults)
    );
  });

  it('should handle missing request ID', async () => {
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
    const response = await handler(mockEvent);

    // Assert
    expect(response.statusCode).toBe(400);
    const responseData = JSON.parse(response.body);
    expect(responseData.error).toContain('Missing requestId');
  });

  it('should handle invalid HTTP method', async () => {
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
    const response = await handler(mockEvent);

    // Assert
    expect(response.statusCode).toBe(405);
    const responseData = JSON.parse(response.body);
    expect(responseData.error).toContain('Method not allowed');
  });

  it('should handle OpenAI API errors gracefully', async () => {
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
    const { getItineraryRequest, handleAgentFailure } = await import('../../itineraries/process-request');
    const OpenAI = (await import('openai')).default;

    vi.mocked(getItineraryRequest).mockResolvedValue(mockItineraryRequest);
    
    const mockOpenAI = {
      chat: {
        completions: {
          create: vi.fn().mockRejectedValue(new Error('OpenAI API Error'))
        }
      }
    };
    vi.mocked(OpenAI).mockImplementation(() => mockOpenAI as any);

    // Act
    const response = await handler(mockEvent);

    // Assert
    expect(response.statusCode).toBe(500);
    expect(handleAgentFailure).toHaveBeenCalledWith(
      'test-request-id',
      'research',
      expect.any(Error)
    );
  });

  it('should handle missing itinerary request', async () => {
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
    const { getItineraryRequest } = await import('../../itineraries/process-request');
    vi.mocked(getItineraryRequest).mockResolvedValue(null);

    // Act
    const response = await handler(mockEvent);

    // Assert
    expect(response.statusCode).toBe(404);
    const responseData = JSON.parse(response.body);
    expect(responseData.error).toContain('Itinerary request not found');
  });
});
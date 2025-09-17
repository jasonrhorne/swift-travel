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

vi.mock('@swift-travel/shared/config', () => ({
  config: {
    redis: { url: 'mock://redis', token: 'mock-token' },
    api: { googlePlacesApiKey: 'mock-places-key', internalApiKey: 'mock-internal' }
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
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}));

vi.mock('../../itineraries/process-request', () => ({
  getItineraryRequest: vi.fn(),
  saveItineraryRequest: vi.fn(),
  completeAgentProcessing: vi.fn(),
  handleAgentFailure: vi.fn()
}));

// Mock fetch globally
global.fetch = vi.fn();

import { handler } from '../../agents/validation';

describe('Validation Agent Unit Tests', () => {
  let mockContext: Context;
  let mockItineraryRequest: ItineraryRequest;
  let mockCurationResults: any;

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
      status: 'validation-in-progress' as ProcessingStatus,
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

  it('should successfully validate activities with Google Places API', async () => {
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
    const { getItineraryRequest } = await import('../../itineraries/process-request');
    const { Redis } = await import('@upstash/redis');

    vi.mocked(getItineraryRequest).mockResolvedValue(mockItineraryRequest);
    
    const mockRedis = {
      get: vi.fn().mockResolvedValue(JSON.stringify(mockCurationResults)),
      setex: vi.fn().mockResolvedValue('OK')
    };
    vi.mocked(Redis).mockImplementation(() => mockRedis as any);

    // Mock successful API responses for both activities
    (global.fetch as any)
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
    const response = await handler(mockEvent, mockContext);

    // Assert
    expect(response.statusCode).toBe(200);
    const responseData = JSON.parse(response.body);
    expect(responseData.success).toBe(true);
    expect(responseData.data.status).toBe('validation-completed');
    
    // Verify validation results structure
    expect(mockRedis.setex).toHaveBeenCalledWith(
      'validation_results:test-request-id',
      3600,
      expect.stringContaining('validationSummary')
    );
  });

  it('should handle Google Places API errors gracefully', async () => {
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
    const { getItineraryRequest } = await import('../../itineraries/process-request');
    const { Redis } = await import('@upstash/redis');

    vi.mocked(getItineraryRequest).mockResolvedValue(mockItineraryRequest);
    
    const mockRedis = {
      get: vi.fn().mockResolvedValue(JSON.stringify(mockCurationResults)),
      setex: vi.fn().mockResolvedValue('OK')
    };
    vi.mocked(Redis).mockImplementation(() => mockRedis as any);

    // Mock API failure
    (global.fetch as any).mockRejectedValue(new Error('API Error'));

    // Act
    const response = await handler(mockEvent, mockContext);

    // Assert
    expect(response.statusCode).toBe(200); // Should still complete with failed validations
    const responseData = JSON.parse(response.body);
    expect(responseData.success).toBe(true);
    expect(responseData.data.status).toBe('validation-completed');
  });

  it('should handle rate limiting from Google Places API', async () => {
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
    const { getItineraryRequest } = await import('../../itineraries/process-request');
    const { Redis } = await import('@upstash/redis');

    vi.mocked(getItineraryRequest).mockResolvedValue(mockItineraryRequest);
    
    const mockRedis = {
      get: vi.fn().mockResolvedValue(JSON.stringify(mockCurationResults)),
      setex: vi.fn().mockResolvedValue('OK')
    };
    vi.mocked(Redis).mockImplementation(() => mockRedis as any);

    // Mock rate limiting response
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 429,
      json: () => Promise.resolve({
        error_message: 'Rate limit exceeded',
        status: 'OVER_QUERY_LIMIT'
      })
    });

    // Act
    const response = await handler(mockEvent, mockContext);

    // Assert
    expect(response.statusCode).toBe(200); // Should handle gracefully
    const responseData = JSON.parse(response.body);
    expect(responseData.success).toBe(true);
  });

  it('should handle missing curation results', async () => {
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
    const { getItineraryRequest } = await import('../../itineraries/process-request');
    const { Redis } = await import('@upstash/redis');

    vi.mocked(getItineraryRequest).mockResolvedValue(mockItineraryRequest);
    
    const mockRedis = {
      get: vi.fn().mockResolvedValue(null), // No curation results
      setex: vi.fn()
    };
    vi.mocked(Redis).mockImplementation(() => mockRedis as any);

    // Act
    const response = await handler(mockEvent, mockContext);

    // Assert
    expect(response.statusCode).toBe(400);
    const responseData = JSON.parse(response.body);
    expect(responseData.error).toContain('curation results not found');
  });

  it('should validate activity coordinates within reasonable bounds', async () => {
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
    const { getItineraryRequest } = await import('../../itineraries/process-request');
    const { Redis } = await import('@upstash/redis');

    vi.mocked(getItineraryRequest).mockResolvedValue(mockItineraryRequest);
    
    const mockRedis = {
      get: vi.fn().mockResolvedValue(JSON.stringify(invalidLocationResults)),
      setex: vi.fn().mockResolvedValue('OK')
    };
    vi.mocked(Redis).mockImplementation(() => mockRedis as any);

    // Mock Places API with no results
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        results: [],
        status: 'ZERO_RESULTS'
      })
    });

    // Act
    const response = await handler(mockEvent, mockContext);

    // Assert
    expect(response.statusCode).toBe(200);
    const responseData = JSON.parse(response.body);
    expect(responseData.success).toBe(true);
    // Should complete but mark validation as failed
  });

  it('should handle invalid HTTP method', async () => {
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
    const response = await handler(mockEvent, mockContext);

    // Assert
    expect(response.statusCode).toBe(405);
    const responseData = JSON.parse(response.body);
    expect(responseData.error).toContain('Method not allowed');
  });
});
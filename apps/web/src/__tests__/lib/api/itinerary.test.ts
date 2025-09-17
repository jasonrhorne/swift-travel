import { describe, it, expect, beforeEach, vi } from 'vitest';
import { itineraryAPI, ItineraryAPIError } from '../../../lib/api/itinerary';
import type { UserRequirements } from '@swift-travel/shared';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Itinerary API', () => {
  const mockUserRequirements: UserRequirements = {
    destination: 'Paris, France',
    persona: 'photography',
    dates: {
      startDate: new Date('2024-12-01'),
      endDate: new Date('2024-12-03')
    },
    budgetRange: 'mid-range',
    groupSize: 2,
    specialRequests: ['Anniversary dinner'],
    accessibilityNeeds: ['Wheelchair accessible venues']
  };

  beforeEach(() => {
    mockFetch.mockClear();
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => 'mock-token'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
    });
  });

  describe('submitRequirements', () => {
    it('should submit requirements successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          requestId: 'test-request-id',
          itineraryRequest: {
            id: 'test-request-id',
            userId: 'test-user-id',
            requirements: mockUserRequirements,
            status: 'initiated'
          }
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await itineraryAPI.submitRequirements(mockUserRequirements);

      expect(result.success).toBe(true);
      expect(result.data?.requestId).toBe('test-request-id');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/itineraries/process-request',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token',
          }),
          body: JSON.stringify({ requirements: mockUserRequirements }),
        })
      );
    });

    it('should handle API errors', async () => {
      const mockErrorResponse = {
        code: 'VALIDATION_ERROR',
        message: 'Invalid destination',
        details: { field: 'destination' }
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => mockErrorResponse,
      });

      const result = await itineraryAPI.submitRequirements(mockUserRequirements);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
      expect(result.error?.message).toBe('Invalid destination');
      expect(result.error?.details).toEqual({ field: 'destination' });
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await itineraryAPI.submitRequirements(mockUserRequirements);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NETWORK_ERROR');
      expect(result.error?.message).toContain('Failed to connect to the server');
    });

    it('should handle malformed JSON responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => { throw new Error('Invalid JSON'); },
      });

      const result = await itineraryAPI.submitRequirements(mockUserRequirements);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('API_ERROR');
      expect(result.error?.message).toContain('HTTP 500');
    });
  });

  describe('getRequestStatus', () => {
    it('should get request status successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          status: 'research-in-progress',
          progress: 25,
          currentAgent: 'research',
          estimatedTimeRemaining: 15
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await itineraryAPI.getRequestStatus('test-request-id');

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('research-in-progress');
      expect(result.data?.progress).toBe(25);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/itineraries/status/test-request-id',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token',
          }),
        })
      );
    });

    it('should handle status check errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({
          code: 'REQUEST_NOT_FOUND',
          message: 'Request not found'
        }),
      });

      const result = await itineraryAPI.getRequestStatus('invalid-id');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('REQUEST_NOT_FOUND');
      expect(result.error?.message).toBe('Request not found');
    });
  });

  describe('cancelRequest', () => {
    it('should cancel request successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await itineraryAPI.cancelRequest('test-request-id');

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/itineraries/cancel/test-request-id',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token',
          }),
        })
      );
    });

    it('should handle cancel errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({
          code: 'CANCEL_FAILED',
          message: 'Cannot cancel completed request'
        }),
      });

      const result = await itineraryAPI.cancelRequest('completed-request-id');

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(ItineraryAPIError);
    });
  });

  describe('Authentication', () => {
    it('should include auth token when available', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await itineraryAPI.submitRequirements(mockUserRequirements);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/itineraries/process-request',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
          }),
        })
      );
    });

    it('should work without auth token', async () => {
      // Mock no token available
      window.localStorage.getItem = vi.fn(() => null);
      Object.defineProperty(window, 'sessionStorage', {
        value: {
          getItem: vi.fn(() => null),
        },
        writable: true,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await itineraryAPI.submitRequirements(mockUserRequirements);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/itineraries/process-request',
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'Authorization': expect.any(String),
          }),
        })
      );
    });
  });

  describe('ItineraryAPIError', () => {
    it('should create error with correct properties', () => {
      const error = new ItineraryAPIError(
        'TEST_CODE',
        'Test message',
        { extra: 'data' }
      );

      expect(error.name).toBe('ItineraryAPIError');
      expect(error.code).toBe('TEST_CODE');
      expect(error.message).toBe('Test message');
      expect(error.details).toEqual({ extra: 'data' });
    });
  });
});
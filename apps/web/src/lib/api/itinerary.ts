import type { UserRequirements, ItineraryRequest } from '@swift-travel/shared';

// API response types
export interface ItinerarySubmissionResponse {
  success: boolean;
  data?: {
    requestId: string;
    itineraryRequest: ItineraryRequest;
  };
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

export interface ItineraryStatusResponse {
  success: boolean;
  data?: {
    status: string;
    progress: number;
    currentAgent: string | null;
    estimatedTimeRemaining: number | null;
  };
  error?: {
    code: string;
    message: string;
  };
}

// API error class
export class ItineraryAPIError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ItineraryAPIError';
  }
}

// Base API client
class ItineraryAPI {
  private baseUrl: string;
  private defaultTimeout: number = 2000; // 2 seconds to meet frontend performance target
  
  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  }
  
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    timeout: number = this.defaultTimeout
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Add auth token if available
    const token = this.getAuthToken();
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      signal: controller.signal,
    };
    
    try {
      const response = await fetch(url, config);
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ItineraryAPIError(
          errorData.code || 'API_ERROR',
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          errorData.details
        );
      }
      
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof ItineraryAPIError) {
        throw error;
      }
      
      // Handle timeout errors
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ItineraryAPIError(
          'TIMEOUT_ERROR',
          `Request timed out after ${timeout}ms. Please try again.`,
          { timeout }
        );
      }
      
      // Handle network errors
      throw new ItineraryAPIError(
        'NETWORK_ERROR',
        'Failed to connect to the server. Please check your connection and try again.',
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }
  
  private getAuthToken(): string | null {
    // Get token from localStorage or session storage
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    }
    return null;
  }
  
  /**
   * Submit user requirements for itinerary generation
   */
  async submitRequirements(requirements: UserRequirements): Promise<ItinerarySubmissionResponse> {
    try {
      const response = await this.request<ItinerarySubmissionResponse>(
        '/itineraries/process-request',
        {
          method: 'POST',
          body: JSON.stringify({ requirements }),
        }
      );
      
      return response;
    } catch (error) {
      if (error instanceof ItineraryAPIError) {
        return {
          success: false,
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
          },
        };
      }
      
      return {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'An unexpected error occurred while submitting your requirements.',
        },
      };
    }
  }
  
  /**
   * Get the status of an itinerary processing request
   */
  async getRequestStatus(requestId: string): Promise<ItineraryStatusResponse> {
    try {
      const response = await this.request<ItineraryStatusResponse>(
        `/itineraries/status/${requestId}`
      );
      
      return response;
    } catch (error) {
      if (error instanceof ItineraryAPIError) {
        return {
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        };
      }
      
      return {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'Failed to get request status.',
        },
      };
    }
  }
  
  /**
   * Cancel an in-progress itinerary request
   */
  async cancelRequest(requestId: string): Promise<{ success: boolean; error?: any }> {
    try {
      await this.request(`/itineraries/cancel/${requestId}`, {
        method: 'POST',
      });
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof ItineraryAPIError ? error : new Error('Failed to cancel request'),
      };
    }
  }
}

// Create singleton instance
export const itineraryAPI = new ItineraryAPI();

// Convenience functions
export const submitItineraryRequirements = (requirements: UserRequirements) =>
  itineraryAPI.submitRequirements(requirements);

export const getItineraryRequestStatus = (requestId: string) =>
  itineraryAPI.getRequestStatus(requestId);

export const cancelItineraryRequest = (requestId: string) =>
  itineraryAPI.cancelRequest(requestId);
// Auth API service layer for Swift Travel
// Following coding standards - no direct HTTP calls in components

import type { 
  MagicLinkRequest, 
  MagicLinkResponse, 
  VerifyTokenRequest, 
  VerifyTokenResponse,
  User,
  AuthError 
} from '@swift-travel/shared';

// API base configuration
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/.netlify/functions';

// Standard error handling
class AuthApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number,
    public details?: any
  ) {
    super(message);
    this.name = 'AuthApiError';
  }
}

// Generic API request handler
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Include cookies for session management
  };
  
  const finalOptions = { ...defaultOptions, ...options };
  
  try {
    const response = await fetch(url, finalOptions);
    
    if (!response.ok) {
      let errorData: any;
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: 'NETWORK_ERROR', message: 'Network request failed' };
      }
      
      throw new AuthApiError(
        errorData.message || 'Request failed',
        errorData.error || 'UNKNOWN_ERROR',
        response.status,
        errorData.details
      );
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof AuthApiError) {
      throw error;
    }
    
    // Network or other errors
    throw new AuthApiError(
      'Network request failed',
      'NETWORK_ERROR',
      0,
      { originalError: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}

// Request magic link
export async function requestMagicLink(email: string): Promise<MagicLinkResponse> {
  const request: MagicLinkRequest = { email };
  
  return apiRequest<MagicLinkResponse>('/auth/magic-link', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

// Verify magic link token
export async function verifyToken(token: string): Promise<VerifyTokenResponse> {
  const request: VerifyTokenRequest = { token };
  
  return apiRequest<VerifyTokenResponse>('/auth/verify', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

// Logout
export async function logout(): Promise<{ success: boolean; message: string }> {
  return apiRequest('/auth/logout', {
    method: 'POST',
  });
}

// Get user profile
export async function getUserProfile(): Promise<{ user: User; itineraries: any[]; success: boolean }> {
  return apiRequest('/auth/profile', {
    method: 'GET',
  });
}

// Update user profile
export async function updateUserProfile(updates: {
  name?: string;
  preferences?: Partial<User['preferences']>;
}): Promise<{ user: User; success: boolean }> {
  return apiRequest('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

// Get current session status (helper function)
export async function getSessionStatus(): Promise<{ authenticated: boolean; user?: User }> {
  try {
    const result = await getUserProfile();
    return {
      authenticated: true,
      user: result.user,
    };
  } catch (error) {
    if (error instanceof AuthApiError && error.statusCode === 401) {
      return { authenticated: false };
    }
    throw error;
  }
}

// Export error class for error handling in components
export { AuthApiError };
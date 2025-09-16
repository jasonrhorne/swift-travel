// Internal authentication utilities for agent communication
// Based on coding standards - X-Internal-Token header security

import { config } from '@swift-travel/shared/config';

export interface AuthValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates internal API authentication for agent-to-agent communication
 */
export function validateInternalAuth(headers: Record<string, string>): AuthValidationResult {
  const internalToken = headers['x-internal-token'] || headers['X-Internal-Token'];
  
  if (!internalToken) {
    return {
      valid: false,
      error: 'Missing X-Internal-Token header'
    };
  }
  
  if (internalToken !== config.api.internalApiKey) {
    return {
      valid: false,
      error: 'Invalid internal token'
    };
  }
  
  return { valid: true };
}

/**
 * Middleware for Netlify Functions to validate internal authentication
 */
export function requireInternalAuth(event: any) {
  const validation = validateInternalAuth(event.headers || {});
  
  if (!validation.valid) {
    throw new Error(validation.error || 'Authentication failed');
  }
  
  return true;
}
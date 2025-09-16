// Standard response utilities for Netlify Functions
// Based on coding standards - structured responses with proper error handling

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  timestamp: string;
}

export function createSuccessResponse<T>(data: T, statusCode: number = 200): {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
} {
  const response: APIResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };

  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Internal-Token',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    },
    body: JSON.stringify(response),
  };
}

export function createErrorResponse(
  statusCode: number, 
  message: string, 
  details?: Record<string, any>
): {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
} {
  const response: APIResponse = {
    success: false,
    error: {
      code: `ERROR_${statusCode}`,
      message,
      details,
    },
    timestamp: new Date().toISOString(),
  };

  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Internal-Token',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    },
    body: JSON.stringify(response),
  };
}
// Auth-specific response utilities for Netlify Functions
// Handles special cases like Set-Cookie headers

export function createAuthResponse(
  statusCode: number,
  data: any,
  extraHeaders?: Record<string, string>
): {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
} {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Internal-Token',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  // Add any extra headers
  if (extraHeaders) {
    Object.assign(headers, extraHeaders);
  }

  return {
    statusCode,
    headers,
    body: JSON.stringify(data),
  };
}

export function createAuthErrorResponse(
  statusCode: number,
  message: string,
  code?: string,
  details?: any
): {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
} {
  return createAuthResponse(statusCode, {
    error: code || `ERROR_${statusCode}`,
    message,
    ...(details && { details }),
    timestamp: new Date().toISOString(),
  });
}

export function createAuthSuccessResponse(
  data: any,
  statusCode: number = 200,
  extraHeaders?: Record<string, string>
): {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
} {
  return createAuthResponse(statusCode, {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  }, extraHeaders);
}
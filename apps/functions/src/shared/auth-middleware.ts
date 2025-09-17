import jwt from 'jsonwebtoken';
import Redis from 'ioredis';
import pino from 'pino';
import { authConfig } from '@swift-travel/shared';
import type { SessionToken } from '@swift-travel/shared';

// Initialize logger
const logger = pino({
  name: 'auth-middleware',
  level: 'info'
});

// Initialize Redis client
const redis = new Redis(authConfig.upstashRedisUrl);

// Revoked token key generator
const getRevokedTokenKey = (jti: string): string => `revoked_token:${jti}`;

export interface AuthContext {
  user: {
    userId: string;
    email: string;
  };
  sessionToken: string;
}

export interface AuthValidationResult {
  success: boolean;
  context?: AuthContext;
  error?: {
    code: string;
    message: string;
    statusCode: number;
  };
}

// Check if token is revoked
async function isTokenRevoked(jti: string): Promise<boolean> {
  try {
    const key = getRevokedTokenKey(jti);
    const result = await redis.get(key);
    return result === 'revoked';
  } catch (error) {
    logger.error({ jti, error: error.message }, 'Failed to check token revocation status');
    return false; // Fail open for availability
  }
}

// Extract token from request headers
function extractToken(event: any): string | null {
  // Try Authorization header first
  const authHeader = event.headers?.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Fallback to cookie
  const cookie = event.headers?.cookie;
  if (cookie) {
    const cookies = cookie.split(';');
    const sessionCookie = cookies.find((c: string) => c.trim().startsWith('session='));
    if (sessionCookie) {
      return sessionCookie.split('=')[1];
    }
  }
  
  return null;
}

// Validate JWT session token
export async function validateSession(event: any): Promise<AuthValidationResult> {
  try {
    const token = extractToken(event);
    
    if (!token) {
      return {
        success: false,
        error: {
          code: 'NO_TOKEN',
          message: 'No authentication token provided',
          statusCode: 401
        }
      };
    }
    
    // Verify JWT signature and expiration
    let payload: SessionToken;
    try {
      payload = jwt.verify(token, authConfig.jwtSecret) as SessionToken;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return {
          success: false,
          error: {
            code: 'TOKEN_EXPIRED',
            message: 'Session token has expired',
            statusCode: 401
          }
        };
      } else if (error.name === 'JsonWebTokenError') {
        return {
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid session token',
            statusCode: 401
          }
        };
      } else {
        throw error;
      }
    }
    
    // Check if token is revoked
    const decoded = jwt.decode(token) as any;
    const jti = decoded.jti || token.substring(0, 16);
    
    if (await isTokenRevoked(jti)) {
      return {
        success: false,
        error: {
          code: 'TOKEN_REVOKED',
          message: 'Session token has been revoked',
          statusCode: 401
        }
      };
    }
    
    // Additional expiration check from payload
    if (payload.expiresAt && new Date() > new Date(payload.expiresAt)) {
      return {
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Session token has expired',
          statusCode: 401
        }
      };
    }
    
    logger.info({ 
      userId: payload.userId, 
      email: payload.email 
    }, 'Session validated successfully');
    
    return {
      success: true,
      context: {
        user: {
          userId: payload.userId,
          email: payload.email
        },
        sessionToken: token
      }
    };
    
  } catch (error) {
    logger.error({ error: error.message }, 'Session validation failed');
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Failed to validate session',
        statusCode: 500
      }
    };
  }
}

// Helper function to create standardized auth error responses
export function createAuthErrorResponse(error: AuthValidationResult['error']) {
  return {
    statusCode: error?.statusCode || 500,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      error: error?.code || 'UNKNOWN_ERROR',
      message: error?.message || 'An unknown error occurred'
    })
  };
}
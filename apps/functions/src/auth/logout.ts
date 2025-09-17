import { Handler } from '@netlify/functions';
import Redis from 'ioredis';
import { randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';
import pino from 'pino';
import { authConfig } from '@swift-travel/shared';
import type { SessionToken, AuthError } from '@swift-travel/shared';

// Initialize logger
const logger = pino({
  name: 'logout',
  level: 'info'
});

// Initialize Redis client
const redis = new Redis(authConfig.upstashRedisUrl);

// Revoked token key generator
const getRevokedTokenKey = (jti: string): string => `revoked_token:${jti}`;

// Extract and validate session token
function extractSessionToken(event: any): { valid: boolean; token?: string; payload?: SessionToken } {
  // Try to get token from Authorization header first
  let token = event.headers?.authorization?.replace('Bearer ', '');
  
  // Fallback to cookie
  if (!token && event.headers?.cookie) {
    const cookies = event.headers.cookie.split(';');
    const sessionCookie = cookies.find(c => c.trim().startsWith('session='));
    if (sessionCookie) {
      token = sessionCookie.split('=')[1];
    }
  }
  
  if (!token) {
    return { valid: false };
  }
  
  try {
    const payload = jwt.verify(token, authConfig.jwtSecret) as SessionToken;
    return { valid: true, token, payload };
  } catch (error) {
    return { valid: false };
  }
}

// Add token to revoked list
async function revokeToken(token: string): Promise<void> {
  try {
    const decoded = jwt.decode(token) as any;
    const jti = decoded.jti || token.substring(0, 16); // Use jti if available, otherwise use token prefix
    const key = getRevokedTokenKey(jti);
    
    // Store revoked token with expiration matching the token's expiration
    const expiresAt = decoded.exp ? decoded.exp * 1000 : Date.now() + (authConfig.sessionExpirationHours * 60 * 60 * 1000);
    const secondsUntilExpiry = Math.max(1, Math.floor((expiresAt - Date.now()) / 1000));
    
    await redis.setex(key, secondsUntilExpiry, 'revoked');
    logger.info({ jti, expiresIn: secondsUntilExpiry }, 'Token revoked');
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to revoke token');
    throw error;
  }
}

export const handler: Handler = async (event) => {
  const requestId = randomBytes(8).toString('hex');
  logger.info({ requestId, method: event.httpMethod, path: event.path }, 'Logout request received');
  
  try {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        },
        body: JSON.stringify({ 
          error: 'Method not allowed',
          message: 'Only POST requests are allowed' 
        })
      };
    }
    
    // Extract and validate session token
    const tokenValidation = extractSessionToken(event);
    if (!tokenValidation.valid || !tokenValidation.token || !tokenValidation.payload) {
      logger.warn({ requestId }, 'No valid session token found');
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'No valid session',
          message: 'No valid session token found'
        })
      };
    }
    
    const { token, payload } = tokenValidation;
    logger.info({ 
      requestId, 
      userId: payload.userId,
      email: payload.email 
    }, 'Processing logout request');
    
    // Revoke the token
    await revokeToken(token);
    
    logger.info({ 
      requestId, 
      userId: payload.userId,
      email: payload.email 
    }, 'Logout successful');
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Set-Cookie': 'session=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/' // Clear the session cookie
      },
      body: JSON.stringify({
        message: 'Logged out successfully',
        success: true
      })
    };
    
  } catch (error) {
    logger.error({ requestId, error: error.message, stack: error.stack }, 'Logout failed');
    
    const authError: AuthError = {
      code: 'INTERNAL_ERROR',
      message: 'An internal error occurred during logout',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    };
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: authError.code,
        message: authError.message,
        details: authError.details
      })
    };
  }
};
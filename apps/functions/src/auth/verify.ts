import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import Redis from 'ioredis';
import { randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';
import pino from 'pino';
import { z } from 'zod';
import { authConfig } from '@swift-travel/shared/config/auth';
import type { VerifyTokenRequest, VerifyTokenResponse, User, AuthError, SessionToken } from '@swift-travel/shared';

// Initialize logger
const logger = pino({
  name: 'verify-token',
  level: 'info'
});

// Initialize clients
const supabase = createClient(authConfig.supabaseUrl, authConfig.supabaseServiceRoleKey);
const redis = new Redis(authConfig.upstashRedisUrl);

// Request validation schema
const VerifyTokenRequestSchema = z.object({
  token: z.string().min(1, 'Token is required')
});

// Token key generator
const getTokenKey = (token: string): string => `magic_token:${token}`;

// Retrieve and validate token from Redis
async function validateMagicToken(token: string): Promise<{ valid: boolean; email?: string }> {
  const key = getTokenKey(token);
  const tokenData = await redis.get(key);
  
  if (!tokenData) {
    return { valid: false };
  }
  
  try {
    const parsed = JSON.parse(tokenData);
    return { valid: true, email: parsed.email };
  } catch (error) {
    logger.error({ token: token.substring(0, 8) + '...', error }, 'Failed to parse token data');
    return { valid: false };
  }
}

// Delete token from Redis (single use)
async function consumeToken(token: string): Promise<void> {
  const key = getTokenKey(token);
  await redis.del(key);
  logger.info({ token: token.substring(0, 8) + '...' }, 'Magic token consumed');
}

// Create or update user in database
async function createOrUpdateUser(email: string): Promise<User> {
  logger.info({ email }, 'Creating or updating user');
  
  // Check if user exists
  const { data: existingUser, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
  
  if (fetchError && fetchError.code !== 'PGRST116') {
    throw new Error(`Failed to fetch user: ${fetchError.message}`);
  }
  
  if (existingUser) {
    // Update last active time
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', existingUser.id)
      .select()
      .single();
    
    if (updateError) {
      throw new Error(`Failed to update user: ${updateError.message}`);
    }
    
    logger.info({ userId: updatedUser.id, email }, 'User updated');
    return {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      preferences: updatedUser.preferences || {
        defaultPersona: null,
        budgetRange: 'mid-range',
        accessibilityNeeds: [],
        dietaryRestrictions: [],
        travelStyle: 'balanced',
        preferredActivities: []
      },
      createdAt: new Date(updatedUser.created_at),
      lastActiveAt: new Date(updatedUser.last_active_at)
    };
  } else {
    // Create new user
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email,
        name: null,
        preferences: {
          defaultPersona: null,
          budgetRange: 'mid-range',
          accessibilityNeeds: [],
          dietaryRestrictions: [],
          travelStyle: 'balanced',
          preferredActivities: []
        },
        created_at: new Date().toISOString(),
        last_active_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (createError) {
      throw new Error(`Failed to create user: ${createError.message}`);
    }
    
    logger.info({ userId: newUser.id, email }, 'New user created');
    return {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      preferences: newUser.preferences,
      createdAt: new Date(newUser.created_at),
      lastActiveAt: new Date(newUser.last_active_at)
    };
  }
}

// Generate JWT session token
function generateSessionToken(user: User): string {
  const payload: SessionToken = {
    userId: user.id,
    email: user.email,
    expiresAt: new Date(Date.now() + authConfig.sessionExpirationHours * 60 * 60 * 1000)
  };
  
  return jwt.sign(payload, authConfig.jwtSecret, {
    expiresIn: `${authConfig.sessionExpirationHours}h`
  });
}

export const handler: Handler = async (event) => {
  const requestId = randomBytes(8).toString('hex');
  logger.info({ requestId, method: event.httpMethod, path: event.path }, 'Token verification request received');
  
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
    
    // Parse and validate request body
    if (!event.body) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: 'Missing request body',
          message: 'Request body is required' 
        })
      };
    }
    
    const body = JSON.parse(event.body);
    const validation = VerifyTokenRequestSchema.safeParse(body);
    
    if (!validation.success) {
      logger.warn({ requestId, errors: validation.error.errors }, 'Invalid request data');
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'Invalid request data',
          message: validation.error.errors[0].message
        })
      };
    }
    
    const { token } = validation.data;
    logger.info({ requestId, token: token.substring(0, 8) + '...' }, 'Processing token verification');
    
    // Validate magic token
    const tokenValidation = await validateMagicToken(token);
    if (!tokenValidation.valid || !tokenValidation.email) {
      logger.warn({ requestId, token: token.substring(0, 8) + '...' }, 'Invalid or expired token');
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'Invalid token',
          message: 'The magic link token is invalid or has expired'
        })
      };
    }
    
    // Consume the token (single use)
    await consumeToken(token);
    
    // Create or update user
    const user = await createOrUpdateUser(tokenValidation.email);
    
    // Generate session token
    const sessionToken = generateSessionToken(user);
    
    logger.info({ 
      requestId, 
      userId: user.id,
      email: user.email 
    }, 'Token verification successful');
    
    const response: VerifyTokenResponse = {
      user,
      sessionToken,
      success: true
    };
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Set-Cookie': `session=${sessionToken}; HttpOnly; Secure; SameSite=Strict; Max-Age=${authConfig.sessionExpirationHours * 3600}; Path=/`
      },
      body: JSON.stringify(response)
    };
    
  } catch (error) {
    logger.error({ requestId, error: error.message, stack: error.stack }, 'Token verification failed');
    
    const authError: AuthError = {
      code: 'INTERNAL_ERROR',
      message: 'An internal error occurred while verifying your token',
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
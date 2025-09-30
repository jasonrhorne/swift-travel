import { Handler } from '@netlify/functions';
import Redis from 'ioredis';
import { randomBytes } from 'crypto';
import pino from 'pino';
import { z } from 'zod';
import { authConfig } from '@swift-travel/shared';
import type { MagicLinkResponse } from '@swift-travel/shared';
import { createAuthResponse, createAuthErrorResponse, createAuthSuccessResponse } from '../shared/auth-response';

// Initialize logger
const logger = pino({
  name: 'magic-link-auth',
  level: 'info'
});

// Initialize Redis client
const redis = new Redis(authConfig.upstashRedisUrl);

// Request validation schema
const MagicLinkRequestSchema = z.object({
  email: z.string().email('Invalid email address')
});

// Rate limiting key generator
const getRateLimitKey = (email: string): string => `rate_limit:magic_link:${email}`;
const getTokenKey = (token: string): string => `magic_token:${token}`;

// Rate limiting check
async function checkRateLimit(email: string): Promise<{ allowed: boolean; remaining: number }> {
  const key = getRateLimitKey(email);
  const current = await redis.get(key);
  const count = current ? parseInt(current) : 0;
  
  if (count >= authConfig.rateLimitPerWindow) {
    return { allowed: false, remaining: 0 };
  }
  
  // Increment counter
  const newCount = count + 1;
  await redis.setex(key, authConfig.rateLimitWindowMinutes * 60, newCount.toString());
  
  return { 
    allowed: true, 
    remaining: authConfig.rateLimitPerWindow - newCount 
  };
}

// Generate secure token
function generateMagicToken(): string {
  return randomBytes(32).toString('hex');
}

// Store token in Redis
async function storeToken(token: string, email: string): Promise<void> {
  const key = getTokenKey(token);
  const expirationSeconds = authConfig.tokenExpirationMinutes * 60;
  
  await redis.setex(key, expirationSeconds, JSON.stringify({
    email,
    createdAt: new Date().toISOString()
  }));
  
  logger.info({ token: token.substring(0, 8) + '...', email }, 'Magic token stored');
}

// Send magic link email using email service
async function sendMagicLinkEmail(email: string, token: string): Promise<void> {
  const { emailService } = await import('../shared/email-service');
  
  const magicLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/verify?token=${token}`;
  
  const result = await emailService.sendMagicLinkEmail({
    email,
    magicLink,
    expirationMinutes: authConfig.tokenExpirationMinutes
  });
  
  if (!result.success) {
    logger.error({ 
      email, 
      error: result.error,
      token: token.substring(0, 8) + '...' 
    }, 'Failed to send magic link email');
    throw new Error(`Failed to send email: ${result.error}`);
  }
  
  logger.info({ 
    email, 
    provider: result.provider,
    messageId: result.messageId,
    token: token.substring(0, 8) + '...' 
  }, 'Magic link email sent successfully');
}

export const handler: Handler = async (event) => {
  const requestId = randomBytes(8).toString('hex');
  logger.info({ requestId, method: event.httpMethod, path: event.path }, 'Magic link request received');
  
  try {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
      return createAuthErrorResponse(
        405,
        'Only POST requests are allowed',
        'METHOD_NOT_ALLOWED'
      );
    }
    
    // Parse and validate request body
    if (!event.body) {
      return createAuthErrorResponse(
        400,
        'Request body is required',
        'MISSING_BODY'
      );
    }
    
    const body = JSON.parse(event.body);
    const validation = MagicLinkRequestSchema.safeParse(body);
    
    if (!validation.success) {
      logger.warn({ requestId, errors: validation.error.errors }, 'Invalid request data');
      return createAuthErrorResponse(
        400,
        validation.error.errors[0].message,
        'INVALID_DATA'
      );
    }
    
    const { email } = validation.data;
    logger.info({ requestId, email }, 'Processing magic link request');
    
    // Check rate limiting
    const rateLimit = await checkRateLimit(email);
    if (!rateLimit.allowed) {
      logger.warn({ requestId, email }, 'Rate limit exceeded');
      return createAuthResponse(
        429,
        {
          error: 'RATE_LIMIT_EXCEEDED',
          message: `Rate limit exceeded. Please wait ${authConfig.rateLimitWindowMinutes} minutes before requesting another magic link.`,
          timestamp: new Date().toISOString()
        },
        {
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': (Date.now() + (authConfig.rateLimitWindowMinutes * 60 * 1000)).toString()
        }
      );
    }
    
    // Generate magic token
    const token = generateMagicToken();
    
    // Store token in Redis
    await storeToken(token, email);
    
    // Send magic link email
    await sendMagicLinkEmail(email, token);
    
    logger.info({ 
      requestId, 
      email, 
      remaining: rateLimit.remaining 
    }, 'Magic link sent successfully');
    
    const response: MagicLinkResponse = {
      message: 'Magic link sent successfully. Please check your email.',
      success: true
    };
    
    return createAuthSuccessResponse(
      response,
      200,
      {
        'X-RateLimit-Remaining': rateLimit.remaining.toString()
      }
    );
    
  } catch (error) {
    const err = error as Error;
    logger.error({ requestId, error: err.message, stack: err.stack }, 'Magic link request failed');
    
    return createAuthErrorResponse(
      500,
      'An internal error occurred while processing your request',
      'INTERNAL_ERROR',
      process.env.NODE_ENV === 'development' ? err.message : undefined
    );
  }
};
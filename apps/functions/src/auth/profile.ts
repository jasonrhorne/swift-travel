import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';
import pino from 'pino';
import { z } from 'zod';
import { authConfig } from '@swift-travel/shared/config/auth';
import { validateSession, createAuthErrorResponse } from '../shared/auth-middleware';
import type { User, UserPreferences, AuthError } from '@swift-travel/shared';

// Initialize logger
const logger = pino({
  name: 'profile-management',
  level: 'info'
});

// Initialize Supabase client
const supabase = createClient(authConfig.supabaseUrl, authConfig.supabaseServiceRoleKey);

// Update profile request schema
const UpdateProfileRequestSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  preferences: z.object({
    defaultPersona: z.enum(['photography', 'food-forward', 'architecture', 'family']).nullable().optional(),
    budgetRange: z.enum(['budget', 'mid-range', 'luxury', 'no-limit']).optional(),
    accessibilityNeeds: z.array(z.string()).optional(),
    dietaryRestrictions: z.array(z.string()).optional(),
    travelStyle: z.enum(['relaxed', 'packed', 'balanced']).optional(),
    preferredActivities: z.array(z.enum(['dining', 'sightseeing', 'culture', 'nature', 'shopping', 'nightlife', 'transport'])).optional()
  }).optional()
});

// Get user profile from database
async function getUserProfile(userId: string): Promise<User> {
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    throw new Error(`Failed to fetch user profile: ${error.message}`);
  }
  
  if (!user) {
    throw new Error('User not found');
  }
  
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    preferences: user.preferences || {
      defaultPersona: null,
      budgetRange: 'mid-range',
      accessibilityNeeds: [],
      dietaryRestrictions: [],
      travelStyle: 'balanced',
      preferredActivities: []
    },
    createdAt: new Date(user.created_at),
    lastActiveAt: new Date(user.last_active_at)
  };
}

// Update user profile in database
async function updateUserProfile(userId: string, updates: any): Promise<User> {
  const updateData: any = {
    last_active_at: new Date().toISOString()
  };
  
  if (updates.name !== undefined) {
    updateData.name = updates.name;
  }
  
  if (updates.preferences !== undefined) {
    // Get current preferences and merge with updates
    const current = await getUserProfile(userId);
    updateData.preferences = {
      ...current.preferences,
      ...updates.preferences
    };
  }
  
  const { data: updatedUser, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', userId)
    .select()
    .single();
  
  if (error) {
    throw new Error(`Failed to update user profile: ${error.message}`);
  }
  
  return {
    id: updatedUser.id,
    email: updatedUser.email,
    name: updatedUser.name,
    preferences: updatedUser.preferences,
    createdAt: new Date(updatedUser.created_at),
    lastActiveAt: new Date(updatedUser.last_active_at)
  };
}

// Get user's itineraries (for ownership enforcement)
async function getUserItineraries(userId: string): Promise<any[]> {
  const { data: itineraries, error } = await supabase
    .from('itineraries')
    .select('id, destination, status, created_at, updated_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) {
    throw new Error(`Failed to fetch user itineraries: ${error.message}`);
  }
  
  return itineraries || [];
}

export const handler: Handler = async (event) => {
  const requestId = randomBytes(8).toString('hex');
  logger.info({ requestId, method: event.httpMethod, path: event.path }, 'Profile request received');
  
  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        },
        body: ''
      };
    }
    
    // Validate session
    const authResult = await validateSession(event);
    if (!authResult.success) {
      return createAuthErrorResponse(authResult.error);
    }
    
    const { user } = authResult.context!;
    logger.info({ requestId, userId: user.userId, method: event.httpMethod }, 'Processing authenticated profile request');
    
    if (event.httpMethod === 'GET') {
      // Get user profile
      const profile = await getUserProfile(user.userId);
      
      // Get user's itineraries for ownership info
      const itineraries = await getUserItineraries(user.userId);
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          user: profile,
          itineraries: itineraries,
          success: true
        })
      };
      
    } else if (event.httpMethod === 'PUT') {
      // Update user profile
      if (!event.body) {
        return {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({
            error: 'Missing request body',
            message: 'Request body is required for profile updates'
          })
        };
      }
      
      const body = JSON.parse(event.body);
      const validation = UpdateProfileRequestSchema.safeParse(body);
      
      if (!validation.success) {
        logger.warn({ requestId, errors: validation.error.errors }, 'Invalid profile update data');
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
      
      // Update profile
      const updatedProfile = await updateUserProfile(user.userId, validation.data);
      
      logger.info({ 
        requestId, 
        userId: user.userId,
        updates: Object.keys(validation.data)
      }, 'Profile updated successfully');
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          user: updatedProfile,
          success: true
        })
      };
      
    } else {
      return {
        statusCode: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS'
        },
        body: JSON.stringify({
          error: 'Method not allowed',
          message: 'Only GET and PUT methods are allowed'
        })
      };
    }
    
  } catch (error) {
    logger.error({ requestId, error: error.message, stack: error.stack }, 'Profile request failed');
    
    const authError: AuthError = {
      code: 'INTERNAL_ERROR',
      message: 'An internal error occurred while processing your profile request',
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
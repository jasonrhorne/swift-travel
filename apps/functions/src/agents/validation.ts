// Validation Agent - Location verification with Google Places API
// Based on story 1.3 requirements for validation agent implementation

import { Context } from '@netlify/functions';
import { Redis } from '@upstash/redis';
import { 
  config,
  ItineraryRequest, 
  Activity,
  ValidationResult
} from '@swift-travel/shared';
import { createErrorResponse, createSuccessResponse } from '../shared/response';
import { requireInternalAuth } from '../shared/auth';
import { agentLogger } from '../shared/logger';
import { 
  getItineraryRequest, 
  completeAgentProcessing,
  handleAgentFailure 
} from '../itineraries/process-request';
import { getCurationResults } from './curation';

const redis = new Redis({
  url: config.redis.url,
  token: config.redis.token,
});

interface ValidationRequestBody {
  requestId: string;
}

interface GooglePlacesResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  types: string[];
  business_status?: string;
  opening_hours?: {
    open_now: boolean;
  };
}

interface ValidationResults {
  validatedActivities: Activity[];
  validationSummary: {
    totalActivities: number;
    verifiedCount: number;
    pendingCount: number;
    failedCount: number;
    averageConfidence: number;
  };
  apiUsage: {
    placesApiCalls: number;
    rateLimitHits: number;
    errors: number;
  };
}

/**
 * Validation Agent handler - verifies locations using Google Places API
 */
export async function handler(event: any, context: Context) {
  const startTime = Date.now();
  let requestId: string = '';
  
  try {
    // Validate authentication
    requireInternalAuth(event);
    
    if (event.httpMethod !== 'POST') {
      return createErrorResponse(405, 'Method not allowed', {});
    }

    const body = JSON.parse(event.body || '{}') as ValidationRequestBody;
    requestId = body.requestId;
    
    if (!requestId) {
      return createErrorResponse(400, 'Missing requestId', {});
    }

    agentLogger.agentStart('validation', requestId);

    // Get the itinerary request and curation results
    const request = await getItineraryRequest(requestId);
    if (!request) {
      throw new Error('Itinerary request not found');
    }

    const curationResults = await getCurationResults(requestId);
    if (!curationResults) {
      throw new Error('Curation results not found');
    }

    // Perform validation
    const validationResults = await performActivityValidation(curationResults.activities);
    
    // Store validation results in Redis
    await saveValidationResults(requestId, validationResults);
    
    // Complete this agent's processing and trigger next agent
    await completeAgentProcessing(requestId, 'validation', {
      validationCompleted: true,
      activitiesValidated: validationResults.validationSummary.totalActivities,
      verifiedCount: validationResults.validationSummary.verifiedCount,
      averageConfidence: validationResults.validationSummary.averageConfidence,
      apiCallsMade: validationResults.apiUsage.placesApiCalls
    });

    const duration = Date.now() - startTime;
    agentLogger.agentComplete('validation', requestId, duration, { 
      verifiedActivities: validationResults.validationSummary.verifiedCount,
      averageConfidence: validationResults.validationSummary.averageConfidence
    });

    return createSuccessResponse({
      requestId,
      status: 'validation-completed',
      verifiedActivities: validationResults.validationSummary.verifiedCount,
      totalActivities: validationResults.validationSummary.totalActivities,
      averageConfidence: validationResults.validationSummary.averageConfidence,
      processingTime: duration
    });

  } catch (error) {
    agentLogger.agentError('validation', requestId, error);
    await handleAgentFailure(requestId, 'validation', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return createErrorResponse(500, 'Validation processing failed', { error: errorMessage });
  }
}

/**
 * Performs validation of all activities using Google Places API
 */
async function performActivityValidation(activities: Activity[]): Promise<ValidationResults> {
  const validatedActivities: Activity[] = [];
  const apiUsage = {
    placesApiCalls: 0,
    rateLimitHits: 0,
    errors: 0
  };

  // Process activities with rate limiting (avoid hitting Google's limits)
  for (const activity of activities) {
    try {
      const validationResult = await validateSingleActivity(activity);
      
      // Update activity with validation results
      activity.validation = validationResult.validation;
      if (validationResult.updatedLocation) {
        activity.location = { ...activity.location, ...validationResult.updatedLocation };
      }
      
      validatedActivities.push(activity);
      apiUsage.placesApiCalls++;
      
      // Rate limiting: 100ms delay between calls
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      // Handle individual activity validation failures gracefully
      activity.validation = {
        status: 'failed',
        googlePlaceId: null,
        lastUpdated: new Date(),
        confidence: 0,
        issues: [(error instanceof Error ? error.message : 'Validation failed')]
      };
      
      validatedActivities.push(activity);
      apiUsage.errors++;
    }
  }

  // Calculate validation summary
  const verifiedCount = validatedActivities.filter(a => a.validation?.status === 'verified').length;
  const pendingCount = validatedActivities.filter(a => a.validation?.status === 'pending').length;
  const failedCount = validatedActivities.filter(a => a.validation?.status === 'failed').length;
  const averageConfidence = validatedActivities.reduce((sum, a) => sum + (a.validation?.confidence || 0), 0) / validatedActivities.length;

  return {
    validatedActivities,
    validationSummary: {
      totalActivities: validatedActivities.length,
      verifiedCount,
      pendingCount,
      failedCount,
      averageConfidence: Math.round(averageConfidence * 100) / 100
    },
    apiUsage
  };
}

/**
 * Validates a single activity using Google Places API
 */
async function validateSingleActivity(activity: Activity): Promise<{
  validation: ValidationResult;
  updatedLocation?: Partial<Activity['location']>;
}> {
  try {
    // Build search query
    const searchQuery = buildPlacesSearchQuery(activity);
    
    // Search for the place
    const placesResult = await searchGooglePlaces(searchQuery, activity.location.coordinates);
    
    if (!placesResult) {
      return {
        validation: {
          status: 'pending',
          googlePlaceId: null,
          lastUpdated: new Date(),
          confidence: 0.3,
          issues: ['No matching place found in Google Places']
        }
      };
    }

    // Calculate confidence based on name similarity and location proximity
    const confidence = calculateValidationConfidence(activity, placesResult);
    
    const validation: ValidationResult = {
      status: confidence > 0.7 ? 'verified' : 'pending',
      googlePlaceId: placesResult.place_id,
      lastUpdated: new Date(),
      confidence,
      issues: confidence < 0.5 ? ['Low confidence match'] : []
    };

    // Update location data if we have better information
    const updatedLocation: Partial<Activity['location']> = {
      googlePlaceId: placesResult.place_id,
      address: placesResult.formatted_address,
      coordinates: {
        lat: placesResult.geometry.location.lat,
        lng: placesResult.geometry.location.lng
      }
    };

    return { validation, updatedLocation };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Google Places API error: ${errorMessage}`);
  }
}

/**
 * Builds search query for Google Places API
 */
function buildPlacesSearchQuery(activity: Activity): string {
  const { name, location } = activity;
  const neighborhood = location.neighborhood ? ` ${location.neighborhood}` : '';
  return `${name}${neighborhood}`.trim();
}

/**
 * Searches Google Places API for a location
 */
async function searchGooglePlaces(
  query: string, 
  coordinates: { lat: number; lng: number }
): Promise<GooglePlacesResult | null> {
  try {
    const params = new URLSearchParams({
      query,
      location: `${coordinates.lat},${coordinates.lng}`,
      radius: '5000', // 5km radius
      key: config.api.googlePlacesApiKey
    });

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?${params}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.status}`);
    }

    const data = await response.json() as any;
    
    if (data.status === 'OVER_QUERY_LIMIT') {
      throw new Error('Google Places API rate limit exceeded');
    }
    
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places API error: ${data.status}`);
    }

    return data.results && data.results.length > 0 ? data.results[0] : null;
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to search Google Places: ${errorMessage}`);
  }
}

/**
 * Calculates validation confidence based on name similarity and location proximity
 */
function calculateValidationConfidence(
  activity: Activity, 
  placesResult: GooglePlacesResult
): number {
  // Name similarity (simple contains check - could be enhanced with fuzzy matching)
  const activityName = activity.name.toLowerCase();
  const placeName = placesResult.name.toLowerCase();
  const nameMatch = placeName.includes(activityName) || activityName.includes(placeName);
  const nameScore = nameMatch ? 0.8 : 0.3;

  // Location proximity (within reasonable distance)
  const distance = calculateDistance(
    activity.location.coordinates,
    placesResult.geometry.location
  );
  
  // Distance scoring: <1km = 1.0, 1-5km = 0.7, 5-10km = 0.4, >10km = 0.1
  let locationScore = 1.0;
  if (distance > 1) locationScore = 0.7;
  if (distance > 5) locationScore = 0.4;
  if (distance > 10) locationScore = 0.1;

  // Business status check
  const statusScore = placesResult.business_status === 'OPERATIONAL' ? 1.0 : 0.7;

  // Combined confidence (weighted average)
  const confidence = (nameScore * 0.5) + (locationScore * 0.3) + (statusScore * 0.2);
  
  return Math.min(Math.max(confidence, 0), 1);
}

/**
 * Calculates distance between two coordinates in kilometers
 */
function calculateDistance(
  coord1: { lat: number; lng: number },
  coord2: { lat: number; lng: number }
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
  const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Saves validation results to Redis for next agent
 */
async function saveValidationResults(requestId: string, results: ValidationResults): Promise<void> {
  const key = `validation_results:${requestId}`;
  await redis.setex(key, 3600, JSON.stringify(results)); // 1 hour expiry
}

/**
 * Retrieves validation results from Redis (for other agents)
 */
export async function getValidationResults(requestId: string): Promise<ValidationResults | null> {
  try {
    const key = `validation_results:${requestId}`;
    const data = await redis.get(key);
    return data ? JSON.parse(data as string) : null;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    agentLogger.agentError('validation', requestId, new Error(`Failed to retrieve validation results: ${errorMessage}`));
    return null;
  }
}
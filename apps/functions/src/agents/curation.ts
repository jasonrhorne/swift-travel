// Curation Agent - Itinerary creation with local context
// Based on story 1.3 requirements for curation agent implementation

import { Redis } from '@upstash/redis';
import OpenAI from 'openai';
import {
  config,
  ItineraryRequest,
  Activity,
  ActivityCategory,
  ActivityTiming,
  ActivityLocation,
  ValidationResult,
  PersonaContext,
  AccessibilityInfo,
} from '@swift-travel/shared';
import { createErrorResponse, createSuccessResponse } from '../shared/response';
import { requireInternalAuth } from '../shared/auth';
import { agentLogger } from '../shared/logger';
import {
  getItineraryRequest,
  completeAgentProcessing,
  handleAgentFailure,
} from '../itineraries/process-request';
import { getResearchResults } from './research';
import { v4 as uuidv4 } from 'uuid';

const redis = new Redis({
  url: config.redis.url,
  token: config.redis.token,
});

const openai = new OpenAI({
  apiKey: config.api.openaiApiKey,
});

interface CurationRequestBody {
  requestId: string;
}

interface CurationResult {
  activities: Activity[];
  itineraryOverview: {
    totalActivities: number;
    estimatedCost: {
      min: number;
      max: number;
      currency: string;
    };
    themes: string[];
    highlights: string[];
    familyConsiderations?: string[];
  };
  curationMetadata: {
    interestAlignment: number;
    childFriendliness?: number;
    logisticalScore: number;
    diversityScore: number;
  };
}

/**
 * Curation Agent handler - creates structured itinerary from research data
 */
export async function handler(event: any) {
  const startTime = Date.now();
  let requestId: string = '';

  try {
    // Validate authentication
    requireInternalAuth(event);

    if (event.httpMethod !== 'POST') {
      return createErrorResponse(405, 'Method not allowed', {});
    }

    const body = JSON.parse(event.body || '{}') as CurationRequestBody;
    requestId = body.requestId;

    if (!requestId) {
      return createErrorResponse(400, 'Missing requestId', {});
    }

    agentLogger.agentStart('curation', requestId);

    // Get the itinerary request and research results
    const request = await getItineraryRequest(requestId);
    if (!request) {
      throw new Error('Itinerary request not found');
    }

    const researchResults = await getResearchResults(requestId);
    if (!researchResults) {
      throw new Error('Research results not found');
    }

    // Perform curation
    const curationResult = await performItineraryCuration(
      request,
      researchResults
    );

    // Store curation results in Redis
    await saveCurationResults(requestId, curationResult);

    // Complete this agent's processing and trigger next agent
    await completeAgentProcessing(requestId, 'curation', {
      curationCompleted: true,
      activitiesCreated: curationResult.activities.length,
      interestAlignment: curationResult.curationMetadata.interestAlignment,
      logisticalScore: curationResult.curationMetadata.logisticalScore,
    });

    const duration = Date.now() - startTime;
    agentLogger.agentComplete('curation', requestId, duration, {
      activitiesCount: curationResult.activities.length,
      interestAlignment: curationResult.curationMetadata.interestAlignment,
    });

    return createSuccessResponse({
      requestId,
      status: 'curation-completed',
      activitiesCreated: curationResult.activities.length,
      themes: curationResult.itineraryOverview.themes,
      processingTime: duration,
    });
  } catch (error) {
    agentLogger.agentError('curation', requestId, error);
    await handleAgentFailure(requestId, 'curation', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    return createErrorResponse(500, 'Curation processing failed', {
      error: errorMessage,
    });
  }
}

/**
 * Performs itinerary curation using OpenAI GPT-4 and research context
 */
async function performItineraryCuration(
  request: ItineraryRequest,
  researchResults: any
): Promise<CurationResult> {
  const prompt = buildCurationPrompt(request, researchResults);

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are an expert travel itinerary curator specializing in US/Canada long weekend getaways. Create detailed, practical, interest-based itineraries in JSON format for 3-4 day trips. Focus on maximizing interests, family-friendliness when needed, and authentic local experiences.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.4,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const parsedResult = JSON.parse(content);
    return formatCurationResult(parsedResult, request);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`OpenAI curation failed: ${errorMessage}`);
  }
}

/**
 * Builds comprehensive curation prompt for OpenAI
 */
function buildCurationPrompt(
  request: ItineraryRequest,
  researchResults: any
): string {
  const { requirements } = request;
  const {
    destination,
    interests = [],
    duration,
    groupSize,
    travelerComposition,
    specialRequests,
    accessibilityNeeds,
  } = requirements;

  // Build child-friendly requirements if applicable
  let childrenGuidance = '';
  if (travelerComposition?.children && travelerComposition.children > 0) {
    const ages = travelerComposition.childrenAges;
    childrenGuidance = `
- Children ages: ${ages.join(', ')}
- CRITICAL: All activities must be appropriate for children aged ${Math.min(...ages)}-${Math.max(...ages)}
- Include family-friendly dining options
- Consider nap times and shorter attention spans
- Ensure bathroom accessibility`;
  }

  return `
Based on this research context, create a detailed 3-4 day long weekend itinerary:

REQUIREMENTS:
- Destination: ${destination} (US/Canada)
- Duration: ${duration} (3-4 days)
- Traveler interests: ${interests.join(', ') || 'General sightseeing'}
- Group composition: ${travelerComposition?.adults || groupSize} adults, ${travelerComposition?.children || 0} children${childrenGuidance}
- Special requests: ${specialRequests.join(', ') || 'None'}
- Accessibility needs: ${accessibilityNeeds.join(', ') || 'None'}

RESEARCH CONTEXT:
${JSON.stringify(researchResults, null, 2)}

Create a JSON response with this structure:

{
  "activities": [
    {
      "name": "Activity name",
      "description": "Detailed description with context",
      "category": "dining|sightseeing|culture|nature|shopping|nightlife|transport",
      "timing": {
        "dayNumber": 1,
        "startTime": "09:00",
        "duration": 120,
        "flexibility": "fixed|flexible|weather-dependent",
        "bufferTime": 30
      },
      "location": {
        "name": "Venue name",
        "address": "Full address",
        "coordinates": {
          "lat": 0.0,
          "lng": 0.0
        },
        "neighborhood": "Area name",
        "accessibility": {
          "wheelchairAccessible": true,
          "hearingAssistance": false,
          "visualAssistance": false,
          "notes": ["accessibility details"]
        }
      },
      "personaContext": {
        "reasoning": "How this aligns with traveler interests: ${interests.join(', ')}",
        "highlights": ["key interest-based highlights"],
        "tips": ["insider tips for this activity"]
      },
      "estimatedCost": {
        "min": 0,
        "max": 0,
        "currency": "USD",
        "notes": ["cost breakdown"]
      }
    }
  ],
  "itineraryOverview": {
    "totalActivities": 0,
    "estimatedCost": {
      "min": 0,
      "max": 0,
      "currency": "USD"
    },
    "themes": ["main themes of the itinerary"],
    "highlights": ["top experiences"]
  },
  "curationMetadata": {
    "interestAlignment": 0.95,
    "childFriendliness": 0.90 if children present,
    "logisticalScore": 0.85,
    "diversityScore": 0.80
  }
}

LONG WEEKEND CURATION GUIDELINES:
1. Create exactly 3-4 days of activities (${duration})
2. Prioritize activities matching interests: ${interests.join(', ')}
3. ${travelerComposition?.children ? 'ENSURE all activities are appropriate for children' : 'Focus on adult experiences'}
4. Plan 3-5 activities per day for optimal pacing
5. Include varied activity categories aligned with interests
6. Respect accessibility needs: ${accessibilityNeeds.join(', ') || 'Standard'}
7. Use realistic US/Canada coordinates and addresses
8. Provide practical timing with buffer time
9. Keep costs reasonable for a weekend getaway
10. Ensure activities flow logistically by proximity

Make the itinerary perfect for a long weekend escape that maximizes the traveler's specific interests.
`;
}

/**
 * Formats and validates curation result from OpenAI
 */
function formatCurationResult(
  parsedResult: any,
  request: ItineraryRequest
): CurationResult {
  if (!parsedResult.activities || !Array.isArray(parsedResult.activities)) {
    throw new Error('Invalid curation result structure from OpenAI');
  }

  const activities: Activity[] = parsedResult.activities.map(
    (activity: any, index: number) => {
      const activityId = uuidv4();

      return {
        id: activityId,
        itineraryId: request.itineraryId || '', // Will be set when itinerary is created
        name: activity.name || `Activity ${index + 1}`,
        description: activity.description || '',
        category: (activity.category as ActivityCategory) || 'sightseeing',
        timing: {
          dayNumber: activity.timing?.dayNumber || 1,
          startTime: activity.timing?.startTime || '09:00',
          duration: activity.timing?.duration || 120,
          flexibility: activity.timing?.flexibility || 'flexible',
          bufferTime: activity.timing?.bufferTime || 30,
        } as ActivityTiming,
        location: {
          name: activity.location?.name || activity.name,
          address: activity.location?.address || '',
          coordinates: {
            lat: activity.location?.coordinates?.lat || 0,
            lng: activity.location?.coordinates?.lng || 0,
          },
          neighborhood: activity.location?.neighborhood || '',
          googlePlaceId: null, // Will be populated by validation agent
          accessibility: {
            wheelchairAccessible:
              activity.location?.accessibility?.wheelchairAccessible || false,
            hearingAssistance:
              activity.location?.accessibility?.hearingAssistance || false,
            visualAssistance:
              activity.location?.accessibility?.visualAssistance || false,
            notes: activity.location?.accessibility?.notes || [],
          } as AccessibilityInfo,
        } as ActivityLocation,
        validation: {
          status: 'pending',
          googlePlaceId: null,
          lastUpdated: new Date(),
          confidence: 0,
          issues: [],
        } as ValidationResult,
        personaContext: {
          reasoning: activity.personaContext?.reasoning || '',
          highlights: activity.personaContext?.highlights || [],
          tips: activity.personaContext?.tips || [],
        } as PersonaContext,
      };
    }
  );

  return {
    activities,
    itineraryOverview: {
      totalActivities: activities.length,
      estimatedCost: {
        min: parsedResult.itineraryOverview?.estimatedCost?.min || 0,
        max: parsedResult.itineraryOverview?.estimatedCost?.max || 0,
        currency:
          parsedResult.itineraryOverview?.estimatedCost?.currency || 'USD',
      },
      themes: parsedResult.itineraryOverview?.themes || [],
      highlights: parsedResult.itineraryOverview?.highlights || [],
      familyConsiderations: request.requirements.travelerComposition?.children
        ? parsedResult.itineraryOverview?.familyConsiderations || ['Family-friendly itinerary']
        : undefined,
    },
    curationMetadata: {
      interestAlignment: Math.min(
        Math.max(parsedResult.curationMetadata?.interestAlignment || 0.8, 0),
        1
      ),
      childFriendliness: request.requirements.travelerComposition?.children
        ? Math.min(
            Math.max(parsedResult.curationMetadata?.childFriendliness || 0.8, 0),
            1
          )
        : undefined,
      logisticalScore: Math.min(
        Math.max(parsedResult.curationMetadata?.logisticalScore || 0.8, 0),
        1
      ),
      diversityScore: Math.min(
        Math.max(parsedResult.curationMetadata?.diversityScore || 0.8, 0),
        1
      ),
    },
  };
}

/**
 * Saves curation results to Redis for next agent
 */
async function saveCurationResults(
  requestId: string,
  results: CurationResult
): Promise<void> {
  const key = `curation_results:${requestId}`;
  await redis.setex(key, 3600, JSON.stringify(results)); // 1 hour expiry
}

/**
 * Retrieves curation results from Redis (for other agents)
 */
export async function getCurationResults(
  requestId: string
): Promise<CurationResult | null> {
  try {
    const key = `curation_results:${requestId}`;
    const data = await redis.get(key);
    return data ? JSON.parse(data as string) : null;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    agentLogger.agentError(
      'curation',
      requestId,
      new Error(`Failed to retrieve curation results: ${errorMessage}`)
    );
    return null;
  }
}

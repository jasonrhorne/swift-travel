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
  };
  curationMetadata: {
    personaAdherence: number;
    budgetAlignment: number;
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
      personaAdherence: curationResult.curationMetadata.personaAdherence,
      budgetAlignment: curationResult.curationMetadata.budgetAlignment,
    });

    const duration = Date.now() - startTime;
    agentLogger.agentComplete('curation', requestId, duration, {
      activitiesCount: curationResult.activities.length,
      personaAdherence: curationResult.curationMetadata.personaAdherence,
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
          content: `You are an expert travel itinerary curator. Create detailed, practical, and persona-specific itineraries in JSON format. Focus on timing, logistics, and authentic local experiences.`,
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
    persona,
    budgetRange,
    groupSize,
    dates,
    specialRequests,
    accessibilityNeeds,
  } = requirements;

  const startDate = dates.startDate.toISOString().split('T')[0];
  const endDate = dates.endDate.toISOString().split('T')[0];
  const tripDays = Math.ceil(
    (dates.endDate.getTime() - dates.startDate.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return `
Based on this research context, create a detailed ${tripDays}-day itinerary:

REQUIREMENTS:
- Destination: ${destination}
- Persona: ${persona}
- Budget: ${budgetRange}
- Group size: ${groupSize}
- Dates: ${startDate} to ${endDate}
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
        "reasoning": "Why this fits the ${persona} persona",
        "highlights": ["key points for this persona"],
        "tips": ["specific ${persona} tips"]
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
    "personaAdherence": 0.95,
    "budgetAlignment": 0.90,
    "logisticalScore": 0.85,
    "diversityScore": 0.80
  }
}

CURATION GUIDELINES:
1. Focus heavily on ${persona} persona preferences
2. Align with ${budgetRange} budget expectations
3. Consider ${groupSize} people logistics
4. Account for ${tripDays} days with realistic timing
5. Include varied activity categories
6. Respect accessibility needs: ${accessibilityNeeds.join(', ') || 'Standard'}
7. Use realistic coordinates and addresses
8. Provide practical timing with buffer time
9. Include cost estimates appropriate for ${budgetRange}
10. Ensure activities flow logistically by day and location

Make the itinerary authentic, practical, and perfectly tailored to the ${persona} persona.
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
    },
    curationMetadata: {
      personaAdherence: Math.min(
        Math.max(parsedResult.curationMetadata?.personaAdherence || 0.8, 0),
        1
      ),
      budgetAlignment: Math.min(
        Math.max(parsedResult.curationMetadata?.budgetAlignment || 0.8, 0),
        1
      ),
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

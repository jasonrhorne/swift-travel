// Research Agent - Destination discovery and context gathering
// Based on story 1.3 requirements for research agent implementation

import { Redis } from '@upstash/redis';
import OpenAI from 'openai';
import {
  config,
  UserRequirements,
  PersonaType,
  BudgetRange,
} from '@swift-travel/shared';
import { createErrorResponse, createSuccessResponse } from '../shared/response';
import { requireInternalAuth } from '../shared/auth';
import { agentLogger } from '../shared/logger';
import {
  getItineraryRequest,
  completeAgentProcessing,
  handleAgentFailure,
} from '../itineraries/process-request';

const redis = new Redis({
  url: config.redis.url,
  token: config.redis.token,
});

const openai = new OpenAI({
  apiKey: config.api.openaiApiKey,
});

interface ResearchRequestBody {
  requestId: string;
}

interface ResearchResult {
  destination: {
    name: string;
    city: string;
    region: string;
    country: string;
    timeZone: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  contextData: {
    culture: string[];
    cuisine: string[];
    attractions: string[];
    neighborhoods: string[];
    transportation: string[];
    seasonalConsiderations: string[];
    budgetInsights: Record<BudgetRange, string>;
  };
  personaRecommendations: Record<
    PersonaType,
    {
      focus: string[];
      recommendations: string[];
      warnings: string[];
    }
  >;
  researchSources: string[];
  confidence: number;
}

/**
 * Research Agent handler - analyzes requirements and gathers destination context
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

    const body = JSON.parse(event.body || '{}') as ResearchRequestBody;
    requestId = body.requestId;

    if (!requestId) {
      return createErrorResponse(400, 'Missing requestId', {});
    }

    agentLogger.agentStart('research', requestId);

    // Get the itinerary request
    const request = await getItineraryRequest(requestId);
    if (!request) {
      throw new Error('Itinerary request not found');
    }

    // Perform research
    const researchResult = await performDestinationResearch(
      request.requirements
    );

    // Store research results in Redis
    await saveResearchResults(requestId, researchResult);

    // Complete this agent's processing and trigger next agent
    await completeAgentProcessing(requestId, 'research', {
      researchCompleted: true,
      destinationAnalyzed: researchResult.destination.name,
      confidence: researchResult.confidence,
      contextItemsGathered: Object.keys(researchResult.contextData).length,
    });

    const duration = Date.now() - startTime;
    agentLogger.agentComplete('research', requestId, duration, {
      destination: researchResult.destination.name,
      confidence: researchResult.confidence,
    });

    return createSuccessResponse({
      requestId,
      status: 'research-completed',
      destination: researchResult.destination.name,
      confidence: researchResult.confidence,
      processingTime: duration,
    });
  } catch (error) {
    agentLogger.agentError('research', requestId, error);
    await handleAgentFailure(requestId, 'research', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    return createErrorResponse(500, 'Research processing failed', {
      error: errorMessage,
    });
  }
}

/**
 * Performs comprehensive destination research using OpenAI GPT-4
 */
async function performDestinationResearch(
  requirements: UserRequirements
): Promise<ResearchResult> {
  const prompt = buildResearchPrompt(requirements);

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a travel research expert specializing in destination analysis. Provide comprehensive, accurate travel information in JSON format. Focus on practical details that would help create a detailed itinerary.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const parsedResult = JSON.parse(content);
    return validateAndFormatResearchResult(parsedResult, requirements);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`OpenAI research failed: ${errorMessage}`);
  }
}

/**
 * Builds comprehensive research prompt for OpenAI
 */
function buildResearchPrompt(requirements: UserRequirements): string {
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
Research destination: ${destination}
Travel dates: ${startDate} to ${endDate} (${tripDays} days)
Persona focus: ${persona}
Budget range: ${budgetRange}
Group size: ${groupSize}
Special requests: ${specialRequests.join(', ') || 'None'}
Accessibility needs: ${accessibilityNeeds.join(', ') || 'None'}

Provide comprehensive destination research in the following JSON structure:

{
  "destination": {
    "name": "Specific destination name",
    "city": "Primary city",
    "region": "State/province/region",
    "country": "Country name",
    "timeZone": "IANA timezone",
    "coordinates": {
      "lat": 0.0,
      "lng": 0.0
    }
  },
  "contextData": {
    "culture": ["cultural highlights", "customs", "etiquette tips"],
    "cuisine": ["local specialties", "dining customs", "dietary considerations"],
    "attractions": ["must-see places", "hidden gems", "seasonal attractions"],
    "neighborhoods": ["recommended areas", "characteristics", "what each offers"],
    "transportation": ["getting around", "local transport", "tips"],
    "seasonalConsiderations": ["weather during travel dates", "seasonal events", "what to expect"],
    "budgetInsights": {
      "budget": "Budget-friendly insights and tips",
      "mid-range": "Mid-range spending insights",
      "luxury": "Luxury experience insights", 
      "no-limit": "Premium/exclusive experience insights"
    }
  },
  "personaRecommendations": {
    "photography": {
      "focus": ["photogenic spots", "golden hour locations"],
      "recommendations": ["specific photo opportunities"],
      "warnings": ["photography restrictions", "permits needed"]
    },
    "food-forward": {
      "focus": ["culinary highlights", "food markets", "cooking classes"],
      "recommendations": ["must-try dishes", "food tours"],
      "warnings": ["dietary considerations", "food safety"]
    },
    "architecture": {
      "focus": ["architectural styles", "historic buildings"],
      "recommendations": ["architectural tours", "design highlights"],
      "warnings": ["access restrictions", "guided tour requirements"]
    },
    "family": {
      "focus": ["family-friendly activities", "kid-safe areas"],
      "recommendations": ["family attractions", "child-friendly dining"],
      "warnings": ["safety considerations", "age restrictions"]
    }
  },
  "researchSources": ["source1", "source2", "source3"],
  "confidence": 0.95
}

Focus especially on the ${persona} persona and ${budgetRange} budget considerations. Consider the ${tripDays}-day duration and travel dates for seasonal recommendations.
`;
}

/**
 * Validates and formats the research result from OpenAI
 */
function validateAndFormatResearchResult(
  parsedResult: any,
  requirements: UserRequirements
): ResearchResult {
  // Validate required fields
  if (
    !parsedResult.destination ||
    !parsedResult.contextData ||
    !parsedResult.personaRecommendations
  ) {
    throw new Error('Invalid research result structure from OpenAI');
  }

  // Ensure all required fields are present with defaults
  const result: ResearchResult = {
    destination: {
      name: parsedResult.destination.name || requirements.destination,
      city: parsedResult.destination.city || requirements.destination,
      region: parsedResult.destination.region || '',
      country: parsedResult.destination.country || '',
      timeZone: parsedResult.destination.timeZone || 'UTC',
      coordinates: {
        lat: parsedResult.destination.coordinates?.lat || 0,
        lng: parsedResult.destination.coordinates?.lng || 0,
      },
    },
    contextData: {
      culture: parsedResult.contextData.culture || [],
      cuisine: parsedResult.contextData.cuisine || [],
      attractions: parsedResult.contextData.attractions || [],
      neighborhoods: parsedResult.contextData.neighborhoods || [],
      transportation: parsedResult.contextData.transportation || [],
      seasonalConsiderations:
        parsedResult.contextData.seasonalConsiderations || [],
      budgetInsights: {
        budget: parsedResult.contextData.budgetInsights?.budget || '',
        'mid-range':
          parsedResult.contextData.budgetInsights?.['mid-range'] || '',
        luxury: parsedResult.contextData.budgetInsights?.luxury || '',
        'no-limit': parsedResult.contextData.budgetInsights?.['no-limit'] || '',
      },
    },
    personaRecommendations: {
      photography: parsedResult.personaRecommendations.photography || {
        focus: [],
        recommendations: [],
        warnings: [],
      },
      'food-forward': parsedResult.personaRecommendations['food-forward'] || {
        focus: [],
        recommendations: [],
        warnings: [],
      },
      architecture: parsedResult.personaRecommendations.architecture || {
        focus: [],
        recommendations: [],
        warnings: [],
      },
      family: parsedResult.personaRecommendations.family || {
        focus: [],
        recommendations: [],
        warnings: [],
      },
    },
    researchSources: parsedResult.researchSources || ['GPT-4 Knowledge Base'],
    confidence: Math.min(Math.max(parsedResult.confidence || 0.8, 0), 1),
  };

  return result;
}

/**
 * Saves research results to Redis for next agent
 */
async function saveResearchResults(
  requestId: string,
  results: ResearchResult
): Promise<void> {
  const key = `research_results:${requestId}`;
  await redis.setex(key, 3600, JSON.stringify(results)); // 1 hour expiry
}

/**
 * Retrieves research results from Redis (for other agents)
 */
export async function getResearchResults(
  requestId: string
): Promise<ResearchResult | null> {
  try {
    const key = `research_results:${requestId}`;
    const data = await redis.get(key);
    return data ? JSON.parse(data as string) : null;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    agentLogger.agentError(
      'research',
      requestId,
      new Error(`Failed to retrieve research results: ${errorMessage}`)
    );
    return null;
  }
}

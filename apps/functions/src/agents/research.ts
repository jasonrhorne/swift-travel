// Research Agent - Destination discovery and context gathering
// Based on story 1.3 requirements for research agent implementation

import { Redis } from '@upstash/redis';
import OpenAI from 'openai';
import {
  config,
  UserRequirements,
  TravelerComposition,
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
    country: 'USA' | 'Canada';
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
    longWeekendHighlights: string[];
    familyFriendlyOptions?: string[];
  };
  interestRecommendations: Record<
    string, // Interest type (food, art, outdoors, etc.)
    {
      focus: string[];
      recommendations: string[];
      tips: string[];
    }
  >;
  ageAppropriateActivities?: {
    babies?: string[]; // 0-2 years
    toddlers?: string[]; // 3-5 years
    kids?: string[]; // 6-11 years
    teens?: string[]; // 12-17 years
  };
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
          content: `You are a travel research expert specializing in US and Canadian destinations for long weekend getaways (3-4 days). Provide comprehensive, accurate travel information in JSON format. Focus on practical details that would help create a detailed weekend itinerary with interest-based personalization.`,
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
    interests = [],
    groupSize,
    travelerComposition,
    specialRequests,
    accessibilityNeeds,
  } = requirements;

  // Build age-appropriate requirements if children present
  let childrenInfo = '';
  if (travelerComposition?.children && travelerComposition.children > 0) {
    const ageGroups = categorizeChildrenAges(travelerComposition.childrenAges);
    childrenInfo = `\nChildren ages: ${travelerComposition.childrenAges.join(', ')}\nAge groups present: ${ageGroups.join(', ')}`;
  }

  return `
Research destination: ${destination} (MUST be in USA or Canada)
Trip duration: Long weekend (3-4 days)
Traveler interests: ${interests.join(', ') || 'General sightseeing'}
Group size: ${groupSize}
Adults: ${travelerComposition?.adults || groupSize}
Children: ${travelerComposition?.children || 0}${childrenInfo}
Special requests: ${specialRequests.join(', ') || 'None'}
Accessibility needs: ${accessibilityNeeds.join(', ') || 'None'}

IMPORTANT CONSTRAINTS:
1. The destination MUST be in the United States or Canada only
2. Focus on a long weekend itinerary (3-4 days)
3. Prioritize activities based on the specified interests
4. If children are present, ensure all recommendations are age-appropriate

Provide comprehensive destination research in the following JSON structure:

{
  "destination": {
    "name": "Specific destination name",
    "city": "Primary city",
    "region": "State or Province",
    "country": "USA or Canada ONLY",
    "timeZone": "IANA timezone",
    "coordinates": {
      "lat": 0.0,
      "lng": 0.0
    }
  },
  "contextData": {
    "culture": ["cultural highlights", "local customs", "etiquette tips"],
    "cuisine": ["local specialties", "dining scenes", "must-try foods"],
    "attractions": ["top attractions for long weekend", "hidden gems", "quick hits"],
    "neighborhoods": ["best areas to explore", "characteristics", "what each offers"],
    "transportation": ["getting around", "weekend transport tips", "parking info"],
    "longWeekendHighlights": ["best 3-4 day experiences", "weekend events", "quick getaway tips"],
    "familyFriendlyOptions": ["family activities IF children present", "kid-friendly dining", "family amenities"]
  },
  "interestRecommendations": {
    ${interests.map(interest => `"${interest}": {
      "focus": ["${interest}-specific highlights", "unique ${interest} experiences"],
      "recommendations": ["top ${interest} activities", "weekend ${interest} spots"],
      "tips": ["${interest} insider tips", "best times for ${interest}"]
    }`).join(',\n    ')}
  },
  ${travelerComposition?.children ? `"ageAppropriateActivities": {
    ${travelerComposition.childrenAges.some(age => age <= 2) ? '"babies": ["baby-friendly venues", "nursing/changing facilities", "stroller-accessible spots"],' : ''}
    ${travelerComposition.childrenAges.some(age => age >= 3 && age <= 5) ? '"toddlers": ["toddler-safe activities", "short-attention span friendly", "playground locations"],' : ''}
    ${travelerComposition.childrenAges.some(age => age >= 6 && age <= 11) ? '"kids": ["interactive experiences", "educational fun", "kid-friendly attractions"],' : ''}
    ${travelerComposition.childrenAges.some(age => age >= 12 && age <= 17) ? '"teens": ["teen-engaging activities", "social media worthy spots", "adventure options"],' : ''}
  },` : ''}
  "researchSources": ["official tourism sites", "local guides", "recent travel data"],
  "confidence": 0.85
}

Focus on creating a perfect long weekend itinerary that maximizes the traveler's interests while being practical for the 3-4 day timeframe.
`;
}

/**
 * Categorizes children ages into age groups
 */
function categorizeChildrenAges(ages: number[]): string[] {
  const groups = new Set<string>();
  ages.forEach(age => {
    if (age <= 2) groups.add('babies (0-2)');
    else if (age <= 5) groups.add('toddlers (3-5)');
    else if (age <= 11) groups.add('kids (6-11)');
    else if (age <= 17) groups.add('teens (12-17)');
  });
  return Array.from(groups);
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
    !parsedResult.interestRecommendations
  ) {
    throw new Error('Invalid research result structure from OpenAI');
  }

  // Validate country is US or Canada
  const country = parsedResult.destination.country?.toUpperCase();
  if (country !== 'USA' && country !== 'CANADA' && 
      country !== 'UNITED STATES' && country !== 'US') {
    throw new Error(`Destination must be in USA or Canada, got: ${country}`);
  }

  // Normalize country name
  const normalizedCountry = (country === 'UNITED STATES' || country === 'US') ? 'USA' : 'Canada';

  // Build interest recommendations with defaults
  const interestRecommendations: Record<string, any> = {};
  const interests = requirements.interests || [];
  
  interests.forEach(interest => {
    interestRecommendations[interest] = parsedResult.interestRecommendations?.[interest] || {
      focus: [`${interest} experiences`, `${interest} highlights`],
      recommendations: [`Top ${interest} activities`],
      tips: [`Best times for ${interest}`],
    };
  });

  // Ensure all required fields are present with defaults
  const result: ResearchResult = {
    destination: {
      name: parsedResult.destination.name || requirements.destination,
      city: parsedResult.destination.city || requirements.destination,
      region: parsedResult.destination.region || '',
      country: normalizedCountry as 'USA' | 'Canada',
      timeZone: parsedResult.destination.timeZone || 'America/New_York',
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
      longWeekendHighlights: parsedResult.contextData.longWeekendHighlights || 
        ['Perfect for a 3-4 day visit', 'Weekend getaway highlights'],
      familyFriendlyOptions: requirements.travelerComposition?.children 
        ? parsedResult.contextData.familyFriendlyOptions || ['Family-friendly activities available']
        : undefined,
    },
    interestRecommendations,
    ageAppropriateActivities: requirements.travelerComposition?.children 
      ? buildAgeAppropriateActivities(parsedResult.ageAppropriateActivities, requirements.travelerComposition)
      : undefined,
    researchSources: parsedResult.researchSources || ['GPT-4 Knowledge Base'],
    confidence: Math.min(Math.max(parsedResult.confidence || 0.85, 0), 1),
  };

  return result;
}

/**
 * Builds age-appropriate activities based on children ages
 */
function buildAgeAppropriateActivities(
  activities: any,
  composition: TravelerComposition
): ResearchResult['ageAppropriateActivities'] {
  const result: ResearchResult['ageAppropriateActivities'] = {};
  
  if (composition.childrenAges.some(age => age <= 2)) {
    result.babies = activities?.babies || [
      'Baby-friendly venues with changing facilities',
      'Stroller-accessible attractions',
      'Quiet spaces for nursing'
    ];
  }
  
  if (composition.childrenAges.some(age => age >= 3 && age <= 5)) {
    result.toddlers = activities?.toddlers || [
      'Short, engaging activities',
      'Playgrounds and interactive spaces',
      'Toddler-friendly dining'
    ];
  }
  
  if (composition.childrenAges.some(age => age >= 6 && age <= 11)) {
    result.kids = activities?.kids || [
      'Interactive museums and exhibits',
      'Outdoor adventures',
      'Educational entertainment'
    ];
  }
  
  if (composition.childrenAges.some(age => age >= 12 && age <= 17)) {
    result.teens = activities?.teens || [
      'Adventure activities',
      'Shopping and entertainment districts',
      'Social media worthy experiences'
    ];
  }
  
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

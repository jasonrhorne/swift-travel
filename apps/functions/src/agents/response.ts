// Response Agent - Final itinerary formatting and database storage
// Based on story 1.3 requirements for response agent implementation

import { Context } from '@netlify/functions';
import { Redis } from '@upstash/redis';
import { createClient } from '@supabase/supabase-js';
import { config } from '@swift-travel/shared/config';
import { 
  ItineraryRequest, 
  Itinerary,
  ItineraryStatus,
  ItineraryMetadata,
  AgentVersions,
  CostEstimate,
  ValidationResults as ItineraryValidationResults
} from '@swift-travel/shared/types';
import { createErrorResponse, createSuccessResponse } from '../shared/response';
import { requireInternalAuth } from '../shared/auth';
import { agentLogger } from '../shared/logger';
import { 
  getItineraryRequest, 
  completeAgentProcessing,
  handleAgentFailure 
} from '../itineraries/process-request';
import { getResearchResults } from './research';
import { getCurationResults } from './curation';
import { getValidationResults } from './validation';
import { v4 as uuidv4 } from 'uuid';

const redis = new Redis({
  url: config.redis.url,
  token: config.redis.token,
});

const supabase = createClient(
  config.database.url,
  config.database.serviceRoleKey
);

interface ResponseRequestBody {
  requestId: string;
}

interface ResponseResult {
  itinerary: Itinerary;
  processingMetrics: {
    totalDuration: number;
    agentDurations: Record<string, number>;
    apiCallsUsed: number;
    qualityScore: number;
  };
}

/**
 * Response Agent handler - formats and stores final itinerary
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

    const body = JSON.parse(event.body || '{}') as ResponseRequestBody;
    requestId = body.requestId;
    
    if (!requestId) {
      return createErrorResponse(400, 'Missing requestId', {});
    }

    agentLogger.agentStart('response', requestId);

    // Get all required data
    const request = await getItineraryRequest(requestId);
    if (!request) {
      throw new Error('Itinerary request not found');
    }

    const researchResults = await getResearchResults(requestId);
    const curationResults = await getCurationResults(requestId);
    const validationResults = await getValidationResults(requestId);

    if (!researchResults || !curationResults || !validationResults) {
      throw new Error('Missing agent results for response generation');
    }

    // Generate final response
    const responseResult = await generateFinalResponse(
      request, 
      researchResults, 
      curationResults, 
      validationResults
    );
    
    // Store in Supabase database
    await storeItinerary(responseResult.itinerary);
    
    // Complete this agent's processing (final step)
    await completeAgentProcessing(requestId, 'response', {
      responseCompleted: true,
      itineraryId: responseResult.itinerary.id,
      qualityScore: responseResult.processingMetrics.qualityScore,
      totalDuration: responseResult.processingMetrics.totalDuration
    });

    // Clean up Redis data (optional - could keep for analytics)
    await cleanupRedisData(requestId);

    const duration = Date.now() - startTime;
    agentLogger.agentComplete('response', requestId, duration, { 
      itineraryId: responseResult.itinerary.id,
      activitiesCount: responseResult.itinerary.activities.length,
      qualityScore: responseResult.processingMetrics.qualityScore
    });

    return createSuccessResponse({
      requestId,
      status: 'completed',
      itinerary: {
        id: responseResult.itinerary.id,
        destination: responseResult.itinerary.destination,
        activities: responseResult.itinerary.activities.length,
        qualityScore: responseResult.itinerary.metadata.qualityScore
      },
      processingMetrics: responseResult.processingMetrics,
      processingTime: duration
    });

  } catch (error) {
    agentLogger.agentError('response', requestId, error);
    await handleAgentFailure(requestId, 'response', error);
    return createErrorResponse(500, 'Response processing failed', { error: error.message });
  }
}

/**
 * Generates the final formatted response and itinerary
 */
async function generateFinalResponse(
  request: ItineraryRequest,
  researchResults: any,
  curationResults: any,
  validationResults: any
): Promise<ResponseResult> {
  
  // Calculate processing metrics
  const processingMetrics = calculateProcessingMetrics(request, validationResults);
  
  // Create final itinerary object
  const itinerary = createFinalItinerary(
    request,
    researchResults,
    curationResults,
    validationResults,
    processingMetrics
  );
  
  return {
    itinerary,
    processingMetrics
  };
}

/**
 * Calculates processing metrics from agent logs
 */
function calculateProcessingMetrics(request: ItineraryRequest, validationResults: any) {
  const processingLog = request.processingLog;
  const totalStartTime = request.createdAt.getTime();
  const totalEndTime = Date.now();
  const totalDuration = totalEndTime - totalStartTime;
  
  // Calculate individual agent durations
  const agentDurations: Record<string, number> = {};
  processingLog.forEach(log => {
    if (log.endTime && log.startTime) {
      agentDurations[log.agent] = log.endTime.getTime() - log.startTime.getTime();
    }
  });
  
  // API calls used (from validation results)
  const apiCallsUsed = validationResults.apiUsage?.placesApiCalls || 0;
  
  // Calculate quality score (composite of various factors)
  const qualityScore = calculateQualityScore(
    validationResults.validationSummary?.averageConfidence || 0.5,
    curationResults.curationMetadata?.personaAdherence || 0.8,
    totalDuration
  );
  
  return {
    totalDuration,
    agentDurations,
    apiCallsUsed,
    qualityScore
  };
}

/**
 * Calculates overall quality score for the itinerary
 */
function calculateQualityScore(
  validationConfidence: number,
  personaAdherence: number,
  processingTime: number
): number {
  // Base quality from validation and persona adherence
  const baseQuality = (validationConfidence * 0.4) + (personaAdherence * 0.4);
  
  // Time penalty (processing should be under 20 seconds)
  const timePenalty = processingTime > 20000 ? 0.1 : 0;
  
  // Processing efficiency bonus
  const efficiencyBonus = processingTime < 15000 ? 0.1 : 0;
  
  const finalScore = baseQuality + 0.2 + efficiencyBonus - timePenalty;
  
  return Math.min(Math.max(finalScore, 0), 1);
}

/**
 * Creates the final itinerary object with all metadata
 */
function createFinalItinerary(
  request: ItineraryRequest,
  researchResults: any,
  curationResults: any,
  validationResults: any,
  processingMetrics: any
): Itinerary {
  
  const itineraryId = uuidv4();
  
  // Update activity IDs with the final itinerary ID
  const activities = validationResults.validatedActivities.map((activity: any) => ({
    ...activity,
    itineraryId
  }));
  
  // Create cost estimate
  const costEstimate: CostEstimate = {
    min: curationResults.itineraryOverview.estimatedCost.min || 0,
    max: curationResults.itineraryOverview.estimatedCost.max || 0,
    currency: curationResults.itineraryOverview.estimatedCost.currency || 'USD',
    breakdown: {
      activities: curationResults.itineraryOverview.estimatedCost.max * 0.6,
      dining: curationResults.itineraryOverview.estimatedCost.max * 0.25,
      transport: curationResults.itineraryOverview.estimatedCost.max * 0.15
    }
  };
  
  // Create validation results summary
  const validationResultsSummary: ItineraryValidationResults = {
    overallScore: validationResults.validationSummary.averageConfidence,
    checks: {
      locationVerified: validationResults.validationSummary.verifiedCount > 0,
      timingRealistic: curationResults.curationMetadata.logisticalScore > 0.7,
      accessibilityChecked: true,
      costEstimated: costEstimate.max > 0
    }
  };
  
  // Create agent versions
  const agentVersions: AgentVersions = {
    research: '1.0.0',
    curation: '1.0.0',
    validation: '1.0.0',
    response: '1.0.0'
  };
  
  // Create metadata
  const metadata: ItineraryMetadata = {
    processingTimeSeconds: Math.round(processingMetrics.totalDuration / 1000),
    agentVersions,
    qualityScore: processingMetrics.qualityScore,
    validationResults: validationResultsSummary,
    costEstimate
  };
  
  return {
    id: itineraryId,
    userId: request.userId,
    destination: researchResults.destination,
    persona: request.requirements.persona,
    status: 'completed' as ItineraryStatus,
    activities,
    metadata,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

/**
 * Stores the final itinerary in Supabase database
 */
async function storeItinerary(itinerary: Itinerary): Promise<void> {
  try {
    // Store main itinerary record
    const { error: itineraryError } = await supabase
      .from('itineraries')
      .insert({
        id: itinerary.id,
        user_id: itinerary.userId,
        destination: itinerary.destination,
        persona: itinerary.persona,
        status: itinerary.status,
        metadata: itinerary.metadata,
        created_at: itinerary.createdAt.toISOString(),
        updated_at: itinerary.updatedAt.toISOString()
      });
      
    if (itineraryError) {
      throw new Error(`Failed to store itinerary: ${itineraryError.message}`);
    }
    
    // Store activities
    const activitiesData = itinerary.activities.map(activity => ({
      id: activity.id,
      itinerary_id: activity.itineraryId,
      name: activity.name,
      description: activity.description,
      category: activity.category,
      timing: activity.timing,
      location: activity.location,
      validation: activity.validation,
      persona_context: activity.personaContext
    }));
    
    const { error: activitiesError } = await supabase
      .from('activities')
      .insert(activitiesData);
      
    if (activitiesError) {
      throw new Error(`Failed to store activities: ${activitiesError.message}`);
    }
    
  } catch (error) {
    throw new Error(`Database storage failed: ${error.message}`);
  }
}

/**
 * Cleans up Redis data after successful processing
 */
async function cleanupRedisData(requestId: string): Promise<void> {
  try {
    const keys = [
      `itinerary_request:${requestId}`,
      `research_results:${requestId}`,
      `curation_results:${requestId}`,
      `validation_results:${requestId}`,
      `processing_timeout:${requestId}`
    ];
    
    await Promise.all(keys.map(key => redis.del(key)));
    
  } catch (error) {
    // Non-critical error - log but don't fail the request
    agentLogger.orchestrationEvent('redis_cleanup_failed', requestId, { error: error.message });
  }
}
"use strict";
// Response Agent - Final itinerary formatting and database storage
// Based on story 1.3 requirements for response agent implementation
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = handler;
const redis_1 = require("@upstash/redis");
const supabase_js_1 = require("@supabase/supabase-js");
const shared_1 = require("@swift-travel/shared");
const response_1 = require("../shared/response");
const auth_1 = require("../shared/auth");
const logger_1 = require("../shared/logger");
const process_request_1 = require("../itineraries/process-request");
const research_1 = require("./research");
const curation_1 = require("./curation");
const validation_1 = require("./validation");
const uuid_1 = require("uuid");
const redis = new redis_1.Redis({
    url: shared_1.config.redis.url,
    token: shared_1.config.redis.token,
});
const supabase = (0, supabase_js_1.createClient)(shared_1.config.database.url, shared_1.config.database.serviceRoleKey);
/**
 * Response Agent handler - formats and stores final itinerary
 */
async function handler(event) {
    const startTime = Date.now();
    let requestId = '';
    try {
        // Validate authentication
        (0, auth_1.requireInternalAuth)(event);
        if (event.httpMethod !== 'POST') {
            return (0, response_1.createErrorResponse)(405, 'Method not allowed', {});
        }
        const body = JSON.parse(event.body || '{}');
        requestId = body.requestId;
        if (!requestId) {
            return (0, response_1.createErrorResponse)(400, 'Missing requestId', {});
        }
        logger_1.agentLogger.agentStart('response', requestId);
        // Get all required data
        const request = await (0, process_request_1.getItineraryRequest)(requestId);
        if (!request) {
            throw new Error('Itinerary request not found');
        }
        const researchResults = await (0, research_1.getResearchResults)(requestId);
        const curationResults = await (0, curation_1.getCurationResults)(requestId);
        const validationResults = await (0, validation_1.getValidationResults)(requestId);
        if (!researchResults || !curationResults || !validationResults) {
            throw new Error('Missing agent results for response generation');
        }
        // Generate final response
        const responseResult = await generateFinalResponse(request, researchResults, curationResults, validationResults);
        // Store in Supabase database
        await storeItinerary(responseResult.itinerary);
        // Complete this agent's processing (final step)
        await (0, process_request_1.completeAgentProcessing)(requestId, 'response', {
            responseCompleted: true,
            itineraryId: responseResult.itinerary.id,
            qualityScore: responseResult.processingMetrics.qualityScore,
            totalDuration: responseResult.processingMetrics.totalDuration,
        });
        // Clean up Redis data (optional - could keep for analytics)
        await cleanupRedisData(requestId);
        const duration = Date.now() - startTime;
        logger_1.agentLogger.agentComplete('response', requestId, duration, {
            itineraryId: responseResult.itinerary.id,
            activitiesCount: responseResult.itinerary.activities.length,
            qualityScore: responseResult.processingMetrics.qualityScore,
        });
        return (0, response_1.createSuccessResponse)({
            requestId,
            status: 'completed',
            itinerary: {
                id: responseResult.itinerary.id,
                destination: responseResult.itinerary.destination,
                activities: responseResult.itinerary.activities.length,
                qualityScore: responseResult.itinerary.metadata.qualityScore,
            },
            processingMetrics: responseResult.processingMetrics,
            processingTime: duration,
        });
    }
    catch (error) {
        logger_1.agentLogger.agentError('response', requestId, error);
        await (0, process_request_1.handleAgentFailure)(requestId, 'response', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return (0, response_1.createErrorResponse)(500, 'Response processing failed', {
            error: errorMessage,
        });
    }
}
/**
 * Generates the final formatted response and itinerary
 */
async function generateFinalResponse(request, researchResults, curationResults, validationResults) {
    // Calculate processing metrics
    const processingMetrics = calculateProcessingMetrics(request, validationResults, curationResults);
    // Create final itinerary object
    const itinerary = createFinalItinerary(request, researchResults, curationResults, validationResults, processingMetrics);
    return {
        itinerary,
        processingMetrics,
    };
}
/**
 * Calculates processing metrics from agent logs
 */
function calculateProcessingMetrics(request, validationResults, curationResults) {
    const processingLog = request.processingLog;
    const totalStartTime = request.createdAt.getTime();
    const totalEndTime = Date.now();
    const totalDuration = totalEndTime - totalStartTime;
    // Calculate individual agent durations
    const agentDurations = {};
    processingLog.forEach(log => {
        if (log.endTime && log.startTime) {
            agentDurations[log.agent] =
                log.endTime.getTime() - log.startTime.getTime();
        }
    });
    // API calls used (from validation results)
    const apiCallsUsed = validationResults.apiUsage?.placesApiCalls || 0;
    // Calculate quality score (composite of various factors)
    const qualityScore = calculateQualityScore(validationResults.validationSummary?.averageConfidence || 0.5, curationResults.curationMetadata?.interestAlignment || 0.8, curationResults.curationMetadata?.childFriendliness, totalDuration);
    return {
        totalDuration,
        agentDurations,
        apiCallsUsed,
        qualityScore,
    };
}
/**
 * Calculates overall quality score for the itinerary
 */
function calculateQualityScore(validationConfidence, interestAlignment, childFriendliness, processingTime) {
    // Base quality from validation and interest alignment
    const baseQuality = validationConfidence * 0.4 + interestAlignment * 0.4;
    // Add child-friendliness factor if applicable
    const familyBonus = childFriendliness ? childFriendliness * 0.1 : 0;
    // Time penalty (processing should be under 20 seconds)
    const timePenalty = processingTime > 20000 ? 0.1 : 0;
    // Processing efficiency bonus
    const efficiencyBonus = processingTime < 15000 ? 0.1 : 0;
    const finalScore = baseQuality + familyBonus + 0.1 + efficiencyBonus - timePenalty;
    return Math.min(Math.max(finalScore, 0), 1);
}
/**
 * Creates the final itinerary object with all metadata
 */
function createFinalItinerary(request, researchResults, curationResults, validationResults, processingMetrics) {
    const itineraryId = (0, uuid_1.v4)();
    // Update activity IDs with the final itinerary ID
    const activities = validationResults.validatedActivities.map((activity) => ({
        ...activity,
        itineraryId,
    }));
    // Create cost estimate
    const costEstimate = {
        min: curationResults.itineraryOverview.estimatedCost.min || 0,
        max: curationResults.itineraryOverview.estimatedCost.max || 0,
        currency: curationResults.itineraryOverview.estimatedCost.currency || 'USD',
        breakdown: {
            activities: curationResults.itineraryOverview.estimatedCost.max * 0.6,
            dining: curationResults.itineraryOverview.estimatedCost.max * 0.25,
            transport: curationResults.itineraryOverview.estimatedCost.max * 0.15,
        },
    };
    // Create validation results summary
    const validationResultsSummary = {
        overallScore: validationResults.validationSummary.averageConfidence,
        checks: {
            locationVerified: validationResults.validationSummary.verifiedCount > 0,
            timingRealistic: curationResults.curationMetadata.logisticalScore > 0.7,
            accessibilityChecked: true,
            costEstimated: costEstimate.max > 0,
        },
    };
    // Create agent versions
    const agentVersions = {
        research: '1.0.0',
        curation: '1.0.0',
        validation: '1.0.0',
        response: '1.0.0',
    };
    // Create metadata
    const metadata = {
        processingTimeSeconds: Math.round(processingMetrics.totalDuration / 1000),
        agentVersions,
        qualityScore: processingMetrics.qualityScore,
        validationResults: validationResultsSummary,
        costEstimate,
    };
    return {
        id: itineraryId,
        userId: request.userId,
        destination: researchResults.destination,
        interests: request.requirements.interests || [],
        status: 'completed',
        activities,
        metadata,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
}
/**
 * Stores the final itinerary in Supabase database
 */
async function storeItinerary(itinerary) {
    try {
        // Store main itinerary record
        const { error: itineraryError } = await supabase
            .from('itineraries')
            .insert({
            id: itinerary.id,
            user_id: itinerary.userId,
            destination: itinerary.destination,
            interests: itinerary.interests,
            status: itinerary.status,
            metadata: itinerary.metadata,
            created_at: itinerary.createdAt.toISOString(),
            updated_at: itinerary.updatedAt.toISOString(),
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
            persona_context: activity.personaContext,
        }));
        const { error: activitiesError } = await supabase
            .from('activities')
            .insert(activitiesData);
        if (activitiesError) {
            throw new Error(`Failed to store activities: ${activitiesError.message}`);
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Database storage failed: ${errorMessage}`);
    }
}
/**
 * Cleans up Redis data after successful processing
 */
async function cleanupRedisData(requestId) {
    try {
        const keys = [
            `itinerary_request:${requestId}`,
            `research_results:${requestId}`,
            `curation_results:${requestId}`,
            `validation_results:${requestId}`,
            `processing_timeout:${requestId}`,
        ];
        await Promise.all(keys.map(key => redis.del(key)));
    }
    catch (error) {
        // Non-critical error - log but don't fail the request
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger_1.agentLogger.orchestrationEvent('redis_cleanup_failed', requestId, {
            error: errorMessage,
        });
    }
}

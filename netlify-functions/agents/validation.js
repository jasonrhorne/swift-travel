"use strict";
// Validation Agent - Location verification with Google Places API
// Based on story 1.3 requirements for validation agent implementation
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = handler;
exports.getValidationResults = getValidationResults;
const redis_1 = require("@upstash/redis");
const shared_1 = require("@swift-travel/shared");
const response_1 = require("../shared/response");
const auth_1 = require("../shared/auth");
const logger_1 = require("../shared/logger");
const process_request_1 = require("../itineraries/process-request");
const curation_1 = require("./curation");
const redis = new redis_1.Redis({
    url: shared_1.config.redis.url,
    token: shared_1.config.redis.token,
});
/**
 * Validation Agent handler - verifies locations using Google Places API
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
        logger_1.agentLogger.agentStart('validation', requestId);
        // Get the itinerary request and curation results
        const request = await (0, process_request_1.getItineraryRequest)(requestId);
        if (!request) {
            throw new Error('Itinerary request not found');
        }
        const curationResults = await (0, curation_1.getCurationResults)(requestId);
        if (!curationResults) {
            throw new Error('Curation results not found');
        }
        // Perform validation
        const validationResults = await performActivityValidation(curationResults.activities);
        // Store validation results in Redis
        await saveValidationResults(requestId, validationResults);
        // Complete this agent's processing and trigger next agent
        await (0, process_request_1.completeAgentProcessing)(requestId, 'validation', {
            validationCompleted: true,
            activitiesValidated: validationResults.validationSummary.totalActivities,
            verifiedCount: validationResults.validationSummary.verifiedCount,
            averageConfidence: validationResults.validationSummary.averageConfidence,
            apiCallsMade: validationResults.apiUsage.placesApiCalls
        });
        const duration = Date.now() - startTime;
        logger_1.agentLogger.agentComplete('validation', requestId, duration, {
            verifiedActivities: validationResults.validationSummary.verifiedCount,
            averageConfidence: validationResults.validationSummary.averageConfidence
        });
        return (0, response_1.createSuccessResponse)({
            requestId,
            status: 'validation-completed',
            verifiedActivities: validationResults.validationSummary.verifiedCount,
            totalActivities: validationResults.validationSummary.totalActivities,
            averageConfidence: validationResults.validationSummary.averageConfidence,
            processingTime: duration
        });
    }
    catch (error) {
        logger_1.agentLogger.agentError('validation', requestId, error);
        await (0, process_request_1.handleAgentFailure)(requestId, 'validation', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return (0, response_1.createErrorResponse)(500, 'Validation processing failed', { error: errorMessage });
    }
}
/**
 * Performs validation of all activities using Google Places API
 */
async function performActivityValidation(activities) {
    const validatedActivities = [];
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
        }
        catch (error) {
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
async function validateSingleActivity(activity) {
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
        const validation = {
            status: confidence > 0.7 ? 'verified' : 'pending',
            googlePlaceId: placesResult.place_id,
            lastUpdated: new Date(),
            confidence,
            issues: confidence < 0.5 ? ['Low confidence match'] : []
        };
        // Update location data if we have better information
        const updatedLocation = {
            googlePlaceId: placesResult.place_id,
            address: placesResult.formatted_address,
            coordinates: {
                lat: placesResult.geometry.location.lat,
                lng: placesResult.geometry.location.lng
            }
        };
        return { validation, updatedLocation };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Google Places API error: ${errorMessage}`);
    }
}
/**
 * Builds search query for Google Places API
 */
function buildPlacesSearchQuery(activity) {
    const { name, location } = activity;
    const neighborhood = location.neighborhood ? ` ${location.neighborhood}` : '';
    return `${name}${neighborhood}`.trim();
}
/**
 * Searches Google Places API for a location
 */
async function searchGooglePlaces(query, coordinates) {
    try {
        const params = new URLSearchParams({
            query,
            location: `${coordinates.lat},${coordinates.lng}`,
            radius: '5000', // 5km radius
            key: shared_1.config.api.googlePlacesApiKey
        });
        const response = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?${params}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            }
        });
        if (!response.ok) {
            throw new Error(`Google Places API error: ${response.status}`);
        }
        const data = await response.json();
        if (data.status === 'OVER_QUERY_LIMIT') {
            throw new Error('Google Places API rate limit exceeded');
        }
        if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
            throw new Error(`Google Places API error: ${data.status}`);
        }
        return data.results && data.results.length > 0 ? data.results[0] : null;
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to search Google Places: ${errorMessage}`);
    }
}
/**
 * Calculates validation confidence based on name similarity and location proximity
 */
function calculateValidationConfidence(activity, placesResult) {
    // Name similarity (simple contains check - could be enhanced with fuzzy matching)
    const activityName = activity.name.toLowerCase();
    const placeName = placesResult.name.toLowerCase();
    const nameMatch = placeName.includes(activityName) || activityName.includes(placeName);
    const nameScore = nameMatch ? 0.8 : 0.3;
    // Location proximity (within reasonable distance)
    const distance = calculateDistance(activity.location.coordinates, placesResult.geometry.location);
    // Distance scoring: <1km = 1.0, 1-5km = 0.7, 5-10km = 0.4, >10km = 0.1
    let locationScore = 1.0;
    if (distance > 1)
        locationScore = 0.7;
    if (distance > 5)
        locationScore = 0.4;
    if (distance > 10)
        locationScore = 0.1;
    // Business status check
    const statusScore = placesResult.business_status === 'OPERATIONAL' ? 1.0 : 0.7;
    // Combined confidence (weighted average)
    const confidence = (nameScore * 0.5) + (locationScore * 0.3) + (statusScore * 0.2);
    return Math.min(Math.max(confidence, 0), 1);
}
/**
 * Calculates distance between two coordinates in kilometers
 */
function calculateDistance(coord1, coord2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
    const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
/**
 * Saves validation results to Redis for next agent
 */
async function saveValidationResults(requestId, results) {
    const key = `validation_results:${requestId}`;
    await redis.setex(key, 3600, JSON.stringify(results)); // 1 hour expiry
}
/**
 * Retrieves validation results from Redis (for other agents)
 */
async function getValidationResults(requestId) {
    try {
        const key = `validation_results:${requestId}`;
        const data = await redis.get(key);
        return data ? JSON.parse(data) : null;
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger_1.agentLogger.agentError('validation', requestId, new Error(`Failed to retrieve validation results: ${errorMessage}`));
        return null;
    }
}

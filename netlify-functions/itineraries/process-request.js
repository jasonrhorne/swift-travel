"use strict";
// ItineraryRequest processing pipeline
// Based on story 1.3 requirements for multi-agent orchestration
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = handler;
exports.getItineraryRequest = getItineraryRequest;
exports.handleAgentFailure = handleAgentFailure;
exports.saveItineraryRequest = saveItineraryRequest;
exports.completeAgentProcessing = completeAgentProcessing;
exports.monitorProcessingTimeout = monitorProcessingTimeout;
const redis_1 = require("@upstash/redis");
const config_1 = require("@swift-travel/shared/config");
const response_1 = require("../shared/response");
// Auth validation handled at API gateway level
const logger_1 = require("../shared/logger");
const redis = new redis_1.Redis({
    url: config_1.config.redis.url,
    token: config_1.config.redis.token,
});
/**
 * Main entry point for itinerary request processing
 * Initiates the agent orchestration pipeline
 */
async function handler(event) {
    try {
        // Validate request
        if (event.httpMethod !== 'POST') {
            return (0, response_1.createErrorResponse)(405, 'Method not allowed', {});
        }
        const body = JSON.parse(event.body || '{}');
        if (!body.itineraryRequestId) {
            return (0, response_1.createErrorResponse)(400, 'Missing itineraryRequestId', {});
        }
        const startTime = Date.now();
        logger_1.logger.info('Starting itinerary request processing', {
            requestId: body.itineraryRequestId,
            startTime
        });
        // Get the itinerary request from Redis
        const requestData = await getItineraryRequest(body.itineraryRequestId);
        if (!requestData) {
            return (0, response_1.createErrorResponse)(404, 'Itinerary request not found', {});
        }
        // Initialize processing state
        await initializeProcessing(requestData, startTime);
        // Start the research agent
        await triggerResearchAgent(requestData.id);
        return (0, response_1.createSuccessResponse)({
            requestId: requestData.id,
            status: 'research-in-progress',
            message: 'Processing initiated successfully'
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger_1.logger.error('Error processing itinerary request', { error: errorMessage });
        return (0, response_1.createErrorResponse)(500, 'Processing failed', { error: errorMessage });
    }
}
/**
 * Retrieves itinerary request from Redis
 */
async function getItineraryRequest(requestId) {
    try {
        const data = await redis.get(`itinerary_request:${requestId}`);
        if (!data) {
            return null;
        }
        // Parse dates properly
        const parsed = JSON.parse(data);
        return {
            ...parsed,
            createdAt: new Date(parsed.createdAt),
            updatedAt: new Date(parsed.updatedAt),
            requirements: {
                ...parsed.requirements,
                dates: {
                    startDate: new Date(parsed.requirements.dates.startDate),
                    endDate: new Date(parsed.requirements.dates.endDate),
                }
            },
            processingLog: parsed.processingLog.map((log) => ({
                ...log,
                startTime: new Date(log.startTime),
                endTime: log.endTime ? new Date(log.endTime) : null,
            }))
        };
    }
    catch (error) {
        logger_1.logger.error('Error retrieving itinerary request', { requestId, error });
        return null;
    }
}
/**
 * Initializes processing state and monitoring
 */
async function initializeProcessing(request, startTime) {
    // Update request status
    request.status = 'research-in-progress';
    request.updatedAt = new Date();
    // Add initial processing log entry
    const initialLog = {
        agent: 'research',
        startTime: new Date(startTime),
        endTime: null,
        status: 'research-in-progress',
        data: { initialized: true },
        error: null
    };
    request.processingLog.push(initialLog);
    // Save to Redis with timeout monitoring
    await saveItineraryRequest(request);
    // Set processing timeout (20 seconds)
    await redis.setex(`processing_timeout:${request.id}`, 20, JSON.stringify({ startTime, maxDuration: 20000 }));
    logger_1.logger.info('Processing initialized', { requestId: request.id });
}
/**
 * Triggers the research agent
 */
async function triggerResearchAgent(requestId) {
    try {
        // Make internal API call to research agent
        const response = await fetch(`${config_1.config.frontend.baseUrl}/agents/research`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Internal-Token': config_1.config.api.internalApiKey,
            },
            body: JSON.stringify({ requestId }),
        });
        if (!response.ok) {
            throw new Error(`Research agent call failed: ${response.status}`);
        }
        logger_1.logger.info('Research agent triggered', { requestId });
    }
    catch (error) {
        logger_1.logger.error('Failed to trigger research agent', { requestId, error });
        await handleAgentFailure(requestId, 'research', error);
        throw error;
    }
}
/**
 * Handles agent failures with graceful degradation
 */
async function handleAgentFailure(requestId, agent, error) {
    try {
        const request = await getItineraryRequest(requestId);
        if (!request) {
            logger_1.logger.error('Cannot handle failure - request not found', { requestId, agent });
            return;
        }
        const processingError = {
            code: error.code || 'AGENT_FAILURE',
            message: error.message || 'Agent processing failed',
            details: { agent, stack: error.stack },
            timestamp: new Date()
        };
        // Update the current agent's log entry
        const currentLog = request.processingLog.find(log => log.agent === agent && log.status === 'running');
        if (currentLog) {
            currentLog.status = 'failed';
            currentLog.endTime = new Date();
            currentLog.error = processingError;
        }
        // Set request status to failed
        request.status = 'failed';
        request.errorDetails = processingError;
        request.updatedAt = new Date();
        await saveItineraryRequest(request);
        logger_1.logger.error('Agent failure handled', { requestId, agent, error: processingError });
    }
    catch (handlingError) {
        logger_1.logger.error('Error handling agent failure', { requestId, agent, handlingError });
    }
}
/**
 * Saves itinerary request to Redis
 */
async function saveItineraryRequest(request) {
    await redis.set(`itinerary_request:${request.id}`, JSON.stringify(request), { ex: 3600 } // 1 hour expiry
    );
}
/**
 * Updates processing status and triggers next agent
 */
async function completeAgentProcessing(requestId, agent, data) {
    try {
        const request = await getItineraryRequest(requestId);
        if (!request) {
            throw new Error('Request not found');
        }
        // Update current agent log
        const currentLog = request.processingLog.find(log => log.agent === agent && log.status === 'running');
        if (currentLog) {
            currentLog.status = 'completed';
            currentLog.endTime = new Date();
            currentLog.data = { ...currentLog.data, ...data };
        }
        // Determine next agent and status
        const { nextStatus, nextAgent } = getNextProcessingStep(agent);
        request.status = nextStatus;
        request.updatedAt = new Date();
        // Add next agent log if not completed
        if (nextAgent) {
            const nextLog = {
                agent: nextAgent,
                startTime: new Date(),
                endTime: null,
                status: 'research-in-progress',
                data: {},
                error: null
            };
            request.processingLog.push(nextLog);
        }
        await saveItineraryRequest(request);
        // Trigger next agent
        if (nextAgent) {
            await triggerNextAgent(nextAgent, requestId);
        }
        logger_1.logger.info('Agent processing completed', { requestId, agent, nextAgent });
    }
    catch (error) {
        logger_1.logger.error('Error completing agent processing', { requestId, agent, error });
        await handleAgentFailure(requestId, agent, error);
        throw error;
    }
}
/**
 * Determines next processing step based on current agent
 */
function getNextProcessingStep(currentAgent) {
    const agentFlow = {
        research: { nextStatus: 'curation-in-progress', nextAgent: 'curation' },
        curation: { nextStatus: 'validation-in-progress', nextAgent: 'validation' },
        validation: { nextStatus: 'response-in-progress', nextAgent: 'response' },
        response: { nextStatus: 'completed', nextAgent: null }
    };
    return agentFlow[currentAgent];
}
/**
 * Triggers the next agent in the pipeline
 */
async function triggerNextAgent(agent, requestId) {
    try {
        const response = await fetch(`${config_1.config.frontend.baseUrl}/agents/${agent}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Internal-Token': config_1.config.api.internalApiKey,
            },
            body: JSON.stringify({ requestId }),
        });
        if (!response.ok) {
            throw new Error(`${agent} agent call failed: ${response.status}`);
        }
        logger_1.logger.info(`${agent} agent triggered`, { requestId });
    }
    catch (error) {
        logger_1.logger.error(`Failed to trigger ${agent} agent`, { requestId, error });
        await handleAgentFailure(requestId, agent, error);
        throw error;
    }
}
/**
 * Monitors processing timeouts
 */
async function monitorProcessingTimeout(requestId) {
    try {
        const timeoutData = await redis.get(`processing_timeout:${requestId}`);
        if (!timeoutData) {
            return; // No timeout monitoring for this request
        }
        const { startTime, maxDuration } = JSON.parse(timeoutData);
        const elapsed = Date.now() - startTime;
        if (elapsed > maxDuration) {
            logger_1.logger.warn('Processing timeout exceeded', { requestId, elapsed, maxDuration });
            // Handle timeout as failure
            await handleAgentFailure(requestId, 'research', {
                code: 'PROCESSING_TIMEOUT',
                message: `Processing exceeded maximum duration of ${maxDuration}ms`
            });
            // Clean up timeout monitoring
            await redis.del(`processing_timeout:${requestId}`);
        }
    }
    catch (error) {
        logger_1.logger.error('Error monitoring processing timeout', { requestId, error });
    }
}

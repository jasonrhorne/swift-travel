// ItineraryRequest processing pipeline
// Based on story 1.3 requirements for multi-agent orchestration

import { Context } from '@netlify/functions';
import { Redis } from '@upstash/redis';
import { config } from '@swift-travel/shared/config';
import { 
  ItineraryRequest, 
  ProcessingStatus, 
  AgentProcessingLog,
  ProcessingError
} from '@swift-travel/shared/types';
import { createErrorResponse, createSuccessResponse } from '../shared/response';
import { validateInternalAuth } from '../shared/auth';
import { logger } from '../shared/logger';

const redis = new Redis({
  url: config.redis.url,
  token: config.redis.token,
});

interface ProcessRequestBody {
  itineraryRequestId: string;
}

/**
 * Main entry point for itinerary request processing
 * Initiates the agent orchestration pipeline
 */
export async function handler(event: any, context: Context) {
  try {
    // Validate request
    if (event.httpMethod !== 'POST') {
      return createErrorResponse(405, 'Method not allowed', {});
    }

    const body = JSON.parse(event.body || '{}') as ProcessRequestBody;
    if (!body.itineraryRequestId) {
      return createErrorResponse(400, 'Missing itineraryRequestId', {});
    }

    const startTime = Date.now();
    logger.info('Starting itinerary request processing', { 
      requestId: body.itineraryRequestId,
      startTime 
    });

    // Get the itinerary request from Redis
    const requestData = await getItineraryRequest(body.itineraryRequestId);
    if (!requestData) {
      return createErrorResponse(404, 'Itinerary request not found', {});
    }

    // Initialize processing state
    await initializeProcessing(requestData, startTime);

    // Start the research agent
    await triggerResearchAgent(requestData.id);

    return createSuccessResponse({
      requestId: requestData.id,
      status: 'research-in-progress',
      message: 'Processing initiated successfully'
    });

  } catch (error) {
    logger.error('Error processing itinerary request', { error });
    return createErrorResponse(500, 'Processing failed', { error: error.message });
  }
}

/**
 * Retrieves itinerary request from Redis
 */
async function getItineraryRequest(requestId: string): Promise<ItineraryRequest | null> {
  try {
    const data = await redis.get(`itinerary_request:${requestId}`);
    if (!data) {
      return null;
    }
    
    // Parse dates properly
    const parsed = JSON.parse(data as string);
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
      processingLog: parsed.processingLog.map((log: any) => ({
        ...log,
        startTime: new Date(log.startTime),
        endTime: log.endTime ? new Date(log.endTime) : null,
      }))
    };
  } catch (error) {
    logger.error('Error retrieving itinerary request', { requestId, error });
    return null;
  }
}

/**
 * Initializes processing state and monitoring
 */
async function initializeProcessing(request: ItineraryRequest, startTime: number): Promise<void> {
  // Update request status
  request.status = 'research-in-progress';
  request.updatedAt = new Date();
  
  // Add initial processing log entry
  const initialLog: AgentProcessingLog = {
    agent: 'research',
    startTime: new Date(startTime),
    endTime: null,
    status: 'running',
    data: { initialized: true },
    error: null
  };
  
  request.processingLog.push(initialLog);
  
  // Save to Redis with timeout monitoring
  await saveItineraryRequest(request);
  
  // Set processing timeout (20 seconds)
  await redis.setex(
    `processing_timeout:${request.id}`, 
    20, 
    JSON.stringify({ startTime, maxDuration: 20000 })
  );
  
  logger.info('Processing initialized', { requestId: request.id });
}

/**
 * Triggers the research agent
 */
async function triggerResearchAgent(requestId: string): Promise<void> {
  try {
    // Make internal API call to research agent
    const response = await fetch(`${config.frontend.baseUrl}/agents/research`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': config.api.internalApiKey,
      },
      body: JSON.stringify({ requestId }),
    });

    if (!response.ok) {
      throw new Error(`Research agent call failed: ${response.status}`);
    }

    logger.info('Research agent triggered', { requestId });
  } catch (error) {
    logger.error('Failed to trigger research agent', { requestId, error });
    await handleAgentFailure(requestId, 'research', error);
    throw error;
  }
}

/**
 * Handles agent failures with graceful degradation
 */
export async function handleAgentFailure(
  requestId: string, 
  agent: AgentProcessingLog['agent'], 
  error: any
): Promise<void> {
  try {
    const request = await getItineraryRequest(requestId);
    if (!request) {
      logger.error('Cannot handle failure - request not found', { requestId, agent });
      return;
    }

    const processingError: ProcessingError = {
      code: error.code || 'AGENT_FAILURE',
      message: error.message || 'Agent processing failed',
      details: { agent, stack: error.stack },
      timestamp: new Date()
    };

    // Update the current agent's log entry
    const currentLog = request.processingLog.find(
      log => log.agent === agent && log.status === 'running'
    );
    
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
    
    logger.error('Agent failure handled', { requestId, agent, error: processingError });
  } catch (handlingError) {
    logger.error('Error handling agent failure', { requestId, agent, handlingError });
  }
}

/**
 * Saves itinerary request to Redis
 */
export async function saveItineraryRequest(request: ItineraryRequest): Promise<void> {
  await redis.set(
    `itinerary_request:${request.id}`, 
    JSON.stringify(request),
    { ex: 3600 } // 1 hour expiry
  );
}

/**
 * Updates processing status and triggers next agent
 */
export async function completeAgentProcessing(
  requestId: string,
  agent: AgentProcessingLog['agent'],
  data: Record<string, any>
): Promise<void> {
  try {
    const request = await getItineraryRequest(requestId);
    if (!request) {
      throw new Error('Request not found');
    }

    // Update current agent log
    const currentLog = request.processingLog.find(
      log => log.agent === agent && log.status === 'running'
    );
    
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
      const nextLog: AgentProcessingLog = {
        agent: nextAgent,
        startTime: new Date(),
        endTime: null,
        status: 'running',
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

    logger.info('Agent processing completed', { requestId, agent, nextAgent });
  } catch (error) {
    logger.error('Error completing agent processing', { requestId, agent, error });
    await handleAgentFailure(requestId, agent, error);
    throw error;
  }
}

/**
 * Determines next processing step based on current agent
 */
function getNextProcessingStep(currentAgent: AgentProcessingLog['agent']) {
  const agentFlow = {
    research: { nextStatus: 'curation-in-progress' as ProcessingStatus, nextAgent: 'curation' as const },
    curation: { nextStatus: 'validation-in-progress' as ProcessingStatus, nextAgent: 'validation' as const },
    validation: { nextStatus: 'response-in-progress' as ProcessingStatus, nextAgent: 'response' as const },
    response: { nextStatus: 'completed' as ProcessingStatus, nextAgent: null }
  };

  return agentFlow[currentAgent];
}

/**
 * Triggers the next agent in the pipeline
 */
async function triggerNextAgent(agent: AgentProcessingLog['agent'], requestId: string): Promise<void> {
  try {
    const response = await fetch(`${config.frontend.baseUrl}/agents/${agent}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': config.api.internalApiKey,
      },
      body: JSON.stringify({ requestId }),
    });

    if (!response.ok) {
      throw new Error(`${agent} agent call failed: ${response.status}`);
    }

    logger.info(`${agent} agent triggered`, { requestId });
  } catch (error) {
    logger.error(`Failed to trigger ${agent} agent`, { requestId, error });
    await handleAgentFailure(requestId, agent, error);
    throw error;
  }
}

/**
 * Monitors processing timeouts
 */
export async function monitorProcessingTimeout(requestId: string): Promise<void> {
  try {
    const timeoutData = await redis.get(`processing_timeout:${requestId}`);
    if (!timeoutData) {
      return; // No timeout monitoring for this request
    }

    const { startTime, maxDuration } = JSON.parse(timeoutData as string);
    const elapsed = Date.now() - startTime;

    if (elapsed > maxDuration) {
      logger.warn('Processing timeout exceeded', { requestId, elapsed, maxDuration });
      
      // Handle timeout as failure
      await handleAgentFailure(requestId, 'research', {
        code: 'PROCESSING_TIMEOUT',
        message: `Processing exceeded maximum duration of ${maxDuration}ms`
      });

      // Clean up timeout monitoring
      await redis.del(`processing_timeout:${requestId}`);
    }
  } catch (error) {
    logger.error('Error monitoring processing timeout', { requestId, error });
  }
}
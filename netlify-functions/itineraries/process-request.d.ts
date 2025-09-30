import { ItineraryRequest, AgentProcessingLog } from '@swift-travel/shared/types';
/**
 * Main entry point for itinerary request processing
 * Initiates the agent orchestration pipeline
 */
export declare function handler(event: any): Promise<{
    statusCode: number;
    headers: Record<string, string>;
    body: string;
}>;
/**
 * Retrieves itinerary request from Redis
 */
export declare function getItineraryRequest(requestId: string): Promise<ItineraryRequest | null>;
/**
 * Handles agent failures with graceful degradation
 */
export declare function handleAgentFailure(requestId: string, agent: AgentProcessingLog['agent'], error: any): Promise<void>;
/**
 * Saves itinerary request to Redis
 */
export declare function saveItineraryRequest(request: ItineraryRequest): Promise<void>;
/**
 * Updates processing status and triggers next agent
 */
export declare function completeAgentProcessing(requestId: string, agent: AgentProcessingLog['agent'], data: Record<string, any>): Promise<void>;
/**
 * Monitors processing timeouts
 */
export declare function monitorProcessingTimeout(requestId: string): Promise<void>;

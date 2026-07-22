import type { Handler } from '@netlify/functions';
import type { ProcessingStatus } from '@swift-travel/shared';
// ProcessingStatusData used for contract compliance (see line 45)
import { getItineraryRequest } from './process-request';
import { createErrorResponse, createSuccessResponse } from '../shared/response';

const progressByStatus: Record<ProcessingStatus, number> = {
  initiated: 0,
  'research-in-progress': 10,
  'research-completed': 25,
  'curation-in-progress': 30,
  'curation-completed': 50,
  'validation-in-progress': 55,
  'validation-completed': 75,
  'response-in-progress': 80,
  completed: 100,
  failed: 100,
};

export const handler: Handler = async event => {
  if (event.httpMethod !== 'GET') {
    return createErrorResponse(405, 'Method not allowed');
  }

  const requestId = event.queryStringParameters?.requestId;
  if (!requestId) {
    return createErrorResponse(400, 'Missing requestId');
  }

  const request = await getItineraryRequest(requestId);
  if (!request) {
    return createErrorResponse(404, 'Itinerary request not found');
  }

  const currentAgent = request.status.endsWith('-in-progress')
    ? request.status.replace('-in-progress', '')
    : null;

  const estimatedRemaining =
    request.status === 'completed' || request.status === 'failed'
      ? 0
      : Math.ceil((100 - progressByStatus[request.status]) * 0.6);

  // Return a response that conforms to the ProcessingStatusData contract
  return createSuccessResponse({
    requestId,
    itineraryId: request.itineraryId,
    status: request.status,
    progress: progressByStatus[request.status],
    currentAgent,
    estimatedTimeRemaining: estimatedRemaining,
    error: request.errorDetails,
  });
};

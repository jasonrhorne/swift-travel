import { describe, expect, it, vi } from 'vitest';

vi.mock('../../itineraries/process-request', () => ({
  getItineraryRequest: vi.fn(),
}));

import { handler } from '../../itineraries/status';
import { getItineraryRequest } from '../../itineraries/process-request';

describe('itinerary status handler', () => {
  it('returns processing status and progress', async () => {
    vi.mocked(getItineraryRequest).mockResolvedValue({
      id: 'request-1',
      userId: 'user-1',
      itineraryId: null,
      requirements: {} as never,
      processingLog: [],
      status: 'curation-in-progress',
      errorDetails: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const response = await handler(
      {
        httpMethod: 'GET',
        queryStringParameters: { requestId: 'request-1' },
      } as never,
      {} as never
    );
    const body = JSON.parse(response!.body!);

    expect(response!.statusCode).toBe(200);
    expect(body.data).toMatchObject({
      requestId: 'request-1',
      status: 'curation-in-progress',
      progress: 30,
      currentAgent: 'curation',
    });
  });

  it('returns 404 for unknown requests', async () => {
    vi.mocked(getItineraryRequest).mockResolvedValue(null);
    const response = await handler(
      {
        httpMethod: 'GET',
        queryStringParameters: { requestId: 'missing' },
      } as never,
      {} as never
    );
    expect(response!.statusCode).toBe(404);
  });
});

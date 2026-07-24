import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProgressTracker from '@/components/itinerary/ProgressTracker';
import { getItinerary, getItineraryRequestStatus } from '@/lib/api/itinerary';

vi.mock('@/lib/monitoring', () => ({
  performanceMonitoring: { trackEvent: vi.fn() },
}));

vi.mock('@/lib/api/itinerary', () => ({
  getItineraryRequestStatus: vi.fn(),
  getItinerary: vi.fn(),
}));

const statusMock = vi.mocked(getItineraryRequestStatus);
const itineraryMock = vi.mocked(getItinerary);

describe('ProgressTracker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    statusMock.mockResolvedValue({
      success: true,
      data: {
        status: 'research-in-progress',
        progress: 20,
        currentAgent: 'research',
        estimatedTimeRemaining: 40,
      },
    });
  });

  it('renders current polling status', async () => {
    render(<ProgressTracker requestId="request-1" />);
    expect(
      await screen.findByText('Researching activities...')
    ).toBeInTheDocument();
    expect(screen.getByText('Progress: 20%')).toBeInTheDocument();
    expect(
      screen.getByText('Estimated time remaining: 40s')
    ).toBeInTheDocument();
  });

  it('retrieves the completed itinerary', async () => {
    const onComplete = vi.fn();
    statusMock.mockResolvedValueOnce({
      success: true,
      data: {
        status: 'completed',
        progress: 100,
        currentAgent: null,
        estimatedTimeRemaining: 0,
        itineraryId: 'itinerary-1',
      },
    });
    const itinerary = { id: 'itinerary-1', activities: [] };
    itineraryMock.mockResolvedValueOnce({
      success: true,
      data: itinerary as never,
    });

    render(<ProgressTracker requestId="request-1" onComplete={onComplete} />);
    await waitFor(() => expect(onComplete).toHaveBeenCalledWith(itinerary));
  });

  it('reports status errors', async () => {
    const onError = vi.fn();
    statusMock.mockResolvedValueOnce({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Request not found' },
    });
    render(<ProgressTracker requestId="request-1" onError={onError} />);
    await waitFor(() =>
      expect(onError).toHaveBeenCalledWith('Request not found')
    );
  });

  it('reports completed requests without itinerary IDs', async () => {
    const onError = vi.fn();
    statusMock.mockResolvedValueOnce({
      success: true,
      data: {
        status: 'completed',
        progress: 100,
        currentAgent: null,
        estimatedTimeRemaining: 0,
      },
    });
    render(<ProgressTracker requestId="request-1" onError={onError} />);
    await waitFor(() =>
      expect(onError).toHaveBeenCalledWith(
        'Completed request is missing an itinerary'
      )
    );
  });
});

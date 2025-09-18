import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ItineraryDisplay from '@/components/itinerary/ItineraryDisplay';
import type { Itinerary } from '@swift-travel/shared';
import { getItinerary, createProgressEventSource } from '@/lib/api/itinerary';

// Mock the API functions
vi.mock('@/lib/api/itinerary', () => ({
  getItinerary: vi.fn(),
  createProgressEventSource: vi.fn()
}));

const mockGetItinerary = vi.mocked(getItinerary);
const mockCreateProgressEventSource = vi.mocked(createProgressEventSource);

// Mock the performance hook
vi.mock('@/hooks/usePerformanceMetrics', () => ({
  usePerformanceMetrics: () => ({
    trackItineraryMetrics: vi.fn(),
    trackError: vi.fn(),
    trackSuccess: vi.fn()
  })
}));

// Mock EventSource
class MockEventSource {
  url: string;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onopen: ((event: Event) => void) | null = null;
  withCredentials = false;
  readyState = EventSource.OPEN;
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSED = 2;
  readonly CONNECTING = 0;
  readonly OPEN = 1;
  readonly CLOSED = 2;
  
  constructor(url: string) {
    this.url = url;
  }
  
  addEventListener(type: string, listener: EventListener) {
    if (type === 'completed') {
      this.onmessage = listener as (event: MessageEvent) => void;
    }
  }
  
  removeEventListener() {}
  
  dispatchEvent(): boolean {
    return true;
  }
  
  close() {
    this.readyState = EventSource.CLOSED;
  }
}

global.EventSource = MockEventSource as unknown as typeof EventSource;

const mockItinerary: Itinerary = {
  id: 'test-itinerary',
  userId: 'user-1',
  title: 'Paris Photography Weekend',
  description: 'A weekend adventure focused on capturing the beauty of Paris',
  destination: 'Paris, France',
  persona: 'photography',
  status: 'finalized',
  startDate: new Date('2024-03-15'),
  endDate: new Date('2024-03-17'),
  activities: [
    {
      id: 'activity-1',
      itineraryId: 'test-itinerary',
      name: 'Sunrise at Eiffel Tower',
      description: 'Capture the golden hour light on the iconic structure',
      category: 'sightseeing',
      timing: {
        dayNumber: 1,
        startTime: '06:00',
        duration: 120,
        flexibility: 'fixed' as const,
        bufferTime: 15
      },
      estimatedDuration: 120,
      location: {
        name: 'Eiffel Tower',
        address: 'Champ de Mars, Paris',
        coordinates: { lat: 48.8584, lng: 2.2945 },
        accessibility: {
          wheelchairAccessible: true,
          notes: ['Accessible viewing areas available']
        }
      },
      persona: 'photography',
      validation: {
        status: 'validated',
        confidence: 9.2,
        issues: []
      }
    }
  ],
  metadata: {
    agentVersions: {
      research: 'v1.0',
      curation: 'v1.0',
      validation: 'v1.0',
      response: 'v1.0'
    },
    processingTime: 45.5,
    qualityScore: 8.5
  },
  createdAt: new Date('2024-03-01T10:00:00Z'),
  updatedAt: new Date('2024-03-01T10:00:00Z')
};

const mockEventSource = new MockEventSource('/test');

describe('ItineraryDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially when itinerary is processing', () => {
    mockGetItinerary.mockResolvedValue({
      success: true,
      data: { ...mockItinerary, status: 'draft' }
    });

    render(<ItineraryDisplay itineraryId="test-itinerary" />);

    expect(screen.getByText('Creating Your Itinerary')).toBeInTheDocument();
  });

  it('displays completed itinerary when status is finalized', async () => {
    mockGetItinerary.mockResolvedValue({
      success: true,
      data: mockItinerary
    });

    render(<ItineraryDisplay itineraryId="test-itinerary" />);

    await waitFor(() => {
      expect(screen.getByText('Paris Photography Weekend')).toBeInTheDocument();
    });
  });

  it('handles API error gracefully', async () => {
    mockGetItinerary.mockRejectedValue(new Error('API Error'));

    render(<ItineraryDisplay itineraryId="test-itinerary" />);

    await waitFor(() => {
      expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();
    });
  });

  it('shows retry button on error', async () => {
    mockGetItinerary.mockResolvedValue({
      success: false,
      error: {
        code: 'GENERATION_FAILED',
        message: 'Generation failed'
      }
    });

    render(<ItineraryDisplay itineraryId="test-itinerary" />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });
  });

  it('displays progress tracking for processing itinerary', async () => {
    mockGetItinerary.mockResolvedValue({
      success: true,
      data: { ...mockItinerary, status: 'draft' }
    });
    
    mockCreateProgressEventSource.mockReturnValue(mockEventSource as unknown as EventSource);

    render(<ItineraryDisplay itineraryId="test-itinerary" />);

    await waitFor(() => {
      expect(screen.getByText('Creating Your Itinerary')).toBeInTheDocument();
    });
  });

  it('shows processing complete message when itinerary is finalized', async () => {
    mockGetItinerary.mockResolvedValue({
      success: true,
      data: { ...mockItinerary, status: 'draft' }
    });
    
    mockCreateProgressEventSource.mockReturnValue(mockEventSource as unknown as EventSource);

    render(<ItineraryDisplay itineraryId="test-itinerary" />);

    // Simulate progress completion
    if (mockEventSource.onmessage) {
      mockEventSource.onmessage({
        data: JSON.stringify({
          stage: 'completed',
          itineraryId: 'test-itinerary'
        })
      } as MessageEvent);
    }

    await waitFor(() => {
      expect(screen.getByText('Paris Photography Weekend')).toBeInTheDocument();
    });
  });

  it('handles session timeout error', async () => {
    mockGetItinerary.mockResolvedValue({
      success: false,
      error: {
        code: 'SESSION_EXPIRED',
        message: 'Session expired'
      }
    });

    render(<ItineraryDisplay itineraryId="test-itinerary" />);

    await waitFor(() => {
      expect(screen.getByText(/session has expired/i)).toBeInTheDocument();
    });
  });

  it('displays performance metrics when available', async () => {
    mockGetItinerary.mockResolvedValue({
      success: true,
      data: mockItinerary
    });

    render(<ItineraryDisplay itineraryId="test-itinerary" />);

    await waitFor(() => {
      expect(screen.getByText('Paris Photography Weekend')).toBeInTheDocument();
    });
  });

  it('shows estimated cost and quality score', async () => {
    mockGetItinerary.mockResolvedValue({
      success: true,
      data: mockItinerary
    });

    render(<ItineraryDisplay itineraryId="test-itinerary" />);

    await waitFor(() => {
      expect(screen.getByText(/\$500/)).toBeInTheDocument();
      expect(screen.getByText(/8\.5/)).toBeInTheDocument();
    });
  });
});
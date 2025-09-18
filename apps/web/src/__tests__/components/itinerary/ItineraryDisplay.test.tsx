import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ItineraryDisplay from '@/components/itinerary/ItineraryDisplay';
import type { Itinerary } from '@swift-travel/shared';

// Mock the API functions
vi.mock('@/lib/api/itinerary', () => ({
  getItinerary: vi.fn(),
  createProgressEventSource: vi.fn()
}));

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
  readyState = EventSource.OPEN;
  
  constructor(url: string) {
    this.url = url;
  }
  
  addEventListener(type: string, listener: EventListener) {
    if (type === 'completed') {
      this.onmessage = listener as any;
    }
  }
  
  close() {
    this.readyState = EventSource.CLOSED;
  }
}

global.EventSource = MockEventSource as any;

const mockItinerary: Itinerary = {
  id: 'test-itinerary',
  userId: 'user-1',
  title: 'Paris Photography Weekend',
  description: 'A weekend adventure focused on capturing the beauty of Paris',
  destination: 'Paris, France',
  persona: 'photography',
  startDate: new Date('2024-06-01'),
  endDate: new Date('2024-06-02'),
  status: 'finalized',
  activities: [{
    id: 'activity-1',
    itineraryId: 'test-itinerary',
    name: 'Eiffel Tower Photography',
    description: 'Golden hour photography session',
    category: 'sightseeing',
    timing: {
      dayNumber: 1,
      startTime: '07:00',
      duration: 120,
      flexibility: 'flexible',
      bufferTime: 30,
    },
    location: {
      name: 'Eiffel Tower',
      address: 'Champ de Mars, Paris',
      coordinates: { lat: 48.8584, lng: 2.2945 },
      neighborhood: 'Champ de Mars',
      googlePlaceId: 'test-place-id',
      accessibility: {
        wheelchairAccessible: true,
        hearingAssistance: false,
        visualAssistance: false,
        notes: []
      }
    },
    estimatedDuration: 120,
    persona: 'photography',
    validation: {
      status: 'verified',
      confidence: 0.95,
      issues: [],
      source: 'google-places'
    },
    personaContext: {
      reasoning: 'Perfect for photography',
      highlights: ['Great views'],
      tips: ['Bring camera']
    }
  }],
  metadata: {
    processingTimeSeconds: 25,
    agentVersions: {
      research: '1.0.0',
      curation: '1.0.0',
      validation: '1.0.0',
      response: '1.0.0'
    }
  },
  createdAt: new Date(),
  updatedAt: new Date()
};

describe('ItineraryDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially when itinerary is processing', () => {
    const { getItinerary } = require('@/lib/api/itinerary');
    getItinerary.mockResolvedValue({
      success: true,
      data: { ...mockItinerary, status: 'processing' }
    });

    render(<ItineraryDisplay itineraryId="test-itinerary" />);

    expect(screen.getByText('Creating Your Itinerary')).toBeInTheDocument();
  });

  it('displays completed itinerary when status is finalized', async () => {
    const { getItinerary } = require('@/lib/api/itinerary');
    getItinerary.mockResolvedValue({
      success: true,
      data: mockItinerary
    });

    render(<ItineraryDisplay itineraryId="test-itinerary" />);

    await waitFor(() => {
      expect(screen.getByText('Paris Photography Weekend')).toBeInTheDocument();
      expect(screen.getByText('Eiffel Tower Photography')).toBeInTheDocument();
    });
  });

  it('shows error state when API call fails', async () => {
    const { getItinerary } = require('@/lib/api/itinerary');
    getItinerary.mockResolvedValue({
      success: false,
      error: 'Network error'
    });

    render(<ItineraryDisplay itineraryId="test-itinerary" />);

    await waitFor(() => {
      expect(screen.getByText(/Unable to load itinerary/)).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });
  });

  it('shows error state when itinerary is not found', async () => {
    const { getItinerary } = require('@/lib/api/itinerary');
    getItinerary.mockResolvedValue({
      success: true,
      data: null
    });

    render(<ItineraryDisplay itineraryId="test-itinerary" />);

    await waitFor(() => {
      expect(screen.getByText('Itinerary Not Found')).toBeInTheDocument();
      expect(screen.getByText('Go Home')).toBeInTheDocument();
    });
  });

  it('handles progress completion and displays final itinerary', async () => {
    const { getItinerary, createProgressEventSource } = require('@/lib/api/itinerary');
    
    // Initially processing
    getItinerary.mockResolvedValueOnce({
      success: true,
      data: { ...mockItinerary, status: 'processing' }
    });

    // After completion
    getItinerary.mockResolvedValueOnce({
      success: true,
      data: mockItinerary
    });

    const mockEventSource = new MockEventSource('/progress/test-request');
    createProgressEventSource.mockReturnValue(mockEventSource);

    render(<ItineraryDisplay itineraryId="test-itinerary" />);

    // Initially shows progress tracker
    expect(screen.getByText('Creating Your Itinerary')).toBeInTheDocument();

    // Simulate completion event
    if (mockEventSource.onmessage) {
      mockEventSource.onmessage(new MessageEvent('message', {
        data: JSON.stringify({ itineraryId: 'test-itinerary' })
      }));
    }

    await waitFor(() => {
      expect(screen.getByText('Paris Photography Weekend')).toBeInTheDocument();
    });
  });

  it('handles progress errors gracefully', async () => {
    const { getItinerary, createProgressEventSource } = require('@/lib/api/itinerary');
    
    getItinerary.mockResolvedValue({
      success: true,
      data: { ...mockItinerary, status: 'processing' }
    });

    const mockEventSource = new MockEventSource('/progress/test-request');
    createProgressEventSource.mockReturnValue(mockEventSource);

    render(<ItineraryDisplay itineraryId="test-itinerary" />);

    // Simulate error
    if (mockEventSource.onerror) {
      mockEventSource.onerror(new Event('error'));
    }

    await waitFor(() => {
      expect(screen.getByText(/Generation Failed/)).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });
  });

  it('tracks performance metrics for successful completion', async () => {
    const { usePerformanceMetrics } = require('@/hooks/usePerformanceMetrics');
    const trackSuccessMock = vi.fn();
    
    usePerformanceMetrics.mockReturnValue({
      trackItineraryMetrics: vi.fn(),
      trackError: vi.fn(),
      trackSuccess: trackSuccessMock
    });

    const { getItinerary } = require('@/lib/api/itinerary');
    getItinerary.mockResolvedValue({
      success: true,
      data: mockItinerary
    });

    render(<ItineraryDisplay itineraryId="test-itinerary" />);

    await waitFor(() => {
      expect(trackSuccessMock).toHaveBeenCalledWith('itinerary_display', {
        itineraryId: 'test-itinerary',
        status: 'finalized',
        activityCount: 1
      });
    });
  });

  it('tracks performance metrics for errors', async () => {
    const { usePerformanceMetrics } = require('@/hooks/usePerformanceMetrics');
    const trackErrorMock = vi.fn();
    
    usePerformanceMetrics.mockReturnValue({
      trackItineraryMetrics: vi.fn(),
      trackError: trackErrorMock,
      trackSuccess: vi.fn()
    });

    const { getItinerary } = require('@/lib/api/itinerary');
    getItinerary.mockResolvedValue({
      success: false,
      error: 'Network error'
    });

    render(<ItineraryDisplay itineraryId="test-itinerary" />);

    await waitFor(() => {
      expect(trackErrorMock).toHaveBeenCalledWith('itinerary_display_error', {
        error: 'Network error',
        itineraryId: 'test-itinerary'
      });
    });
  });
});
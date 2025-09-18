import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ProgressTracker from '@/components/itinerary/ProgressTracker';
import type { Itinerary } from '@swift-travel/shared';
import { createProgressEventSource, getItinerary } from '@/lib/api/itinerary';

// Mock the performance monitoring
vi.mock('@/lib/monitoring', () => ({
  performanceMonitoring: {
    trackEvent: vi.fn()
  }
}));

// Mock the API functions
vi.mock('@/lib/api/itinerary', () => ({
  createProgressEventSource: vi.fn(),
  getItinerary: vi.fn()
}));

const mockCreateProgressEventSource = vi.mocked(createProgressEventSource);
const mockGetItinerary = vi.mocked(getItinerary);

// Mock EventSource
class MockEventSource {
  url: string;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onopen: ((event: Event) => void) | null = null;
  withCredentials = false;
  readyState = EventSource.CONNECTING;
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSED = 2;
  readonly CONNECTING = 0;
  readonly OPEN = 1;
  readonly CLOSED = 2;
  
  constructor(url: string) {
    this.url = url;
    this.readyState = EventSource.OPEN;
  }
  
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent(): boolean { return true; }
  
  close() {
    this.readyState = EventSource.CLOSED;
  }
  
  // Helper method to simulate events
  simulate(type: string, data: unknown) {
    if (type === 'message' && this.onmessage) {
      this.onmessage(new MessageEvent('message', { data: JSON.stringify(data) }));
    }
  }
}

global.EventSource = MockEventSource as unknown as typeof EventSource;

const mockItinerary: Itinerary = {
  id: 'test-itinerary',
  userId: 'user-1',
  title: 'Test Itinerary',
  destination: 'Paris, France',
  persona: 'photography',
  status: 'finalized',
  activities: [],
  metadata: {
    agentVersions: {
      research: 'v1.0',
      curation: 'v1.0',
      validation: 'v1.0',
      response: 'v1.0'
    }
  },
  createdAt: new Date(),
  updatedAt: new Date()
};

describe('ProgressTracker', () => {
  let mockEventSource: MockEventSource;

  beforeEach(() => {
    vi.clearAllMocks();
    mockEventSource = new MockEventSource('/test');
    mockCreateProgressEventSource.mockReturnValue(mockEventSource as unknown as EventSource);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders initial state correctly', () => {
    render(<ProgressTracker requestId="test-request" />);

    expect(screen.getByText('Creating Your Itinerary')).toBeInTheDocument();
    expect(screen.getByText('Researching activities...')).toBeInTheDocument();
  });

  it('shows progress steps in correct order', () => {
    render(<ProgressTracker requestId="test-request" />);

    const steps = screen.getAllByRole('listitem');
    expect(steps).toHaveLength(4);
    expect(steps[0]).toHaveTextContent('Research');
    expect(steps[1]).toHaveTextContent('Curation');
    expect(steps[2]).toHaveTextContent('Validation');
    expect(steps[3]).toHaveTextContent('Response');
  });

  it('updates progress when receiving SSE messages', async () => {
    render(<ProgressTracker requestId="test-request" />);

    // Simulate research completion
    mockEventSource.simulate('message', {
      stage: 'research-completed',
      message: 'Research completed',
      progress: 25
    });

    await waitFor(() => {
      expect(screen.getByText('Curating activities...')).toBeInTheDocument();
    });
  });

  it('handles completion event correctly', async () => {
    const mockOnComplete = vi.fn();
    
    render(<ProgressTracker requestId="test-request" onComplete={mockOnComplete} />);

    mockGetItinerary.mockResolvedValue({
      success: true,
      data: mockItinerary
    });

    // Simulate completion
    mockEventSource.simulate('message', {
      stage: 'completed',
      itineraryId: 'test-itinerary'
    });

    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalledWith(mockItinerary);
    });
  });

  it('shows error state when connection fails', async () => {
    render(<ProgressTracker requestId="test-request" />);

    // Simulate connection error
    if (mockEventSource.onerror) {
      mockEventSource.onerror(new Event('error'));
    }

    await waitFor(() => {
      expect(screen.getByText(/Connection lost/)).toBeInTheDocument();
    });
  });

  it('attempts to reconnect after error', async () => {
    render(<ProgressTracker requestId="test-request" />);

    // Simulate connection error
    if (mockEventSource.onerror) {
      mockEventSource.onerror(new Event('error'));
    }

    await waitFor(() => {
      expect(screen.getByText(/Reconnecting/)).toBeInTheDocument();
    });
  });

  it('shows estimated time remaining', () => {
    render(<ProgressTracker requestId="test-request" />);

    expect(screen.getByText(/Estimated time:/)).toBeInTheDocument();
  });

  it('handles different processing stages', async () => {
    render(<ProgressTracker requestId="test-request" />);

    // Test curation stage
    mockEventSource.simulate('message', {
      stage: 'curation-in-progress',
      message: 'Curating activities',
      progress: 50
    });

    await waitFor(() => {
      expect(screen.getByText('Curating activities')).toBeInTheDocument();
    });

    // Test validation stage
    mockEventSource.simulate('message', {
      stage: 'validation-in-progress',
      message: 'Validating recommendations',
      progress: 75
    });

    await waitFor(() => {
      expect(screen.getByText('Validating recommendations')).toBeInTheDocument();
    });
  });

  it('cleans up event source on unmount', () => {
    const { unmount } = render(<ProgressTracker requestId="test-request" />);
    
    const closeSpy = vi.spyOn(mockEventSource, 'close');
    
    unmount();
    
    expect(closeSpy).toHaveBeenCalled();
  });

  it('handles progress with custom messages', async () => {
    render(<ProgressTracker requestId="test-request" />);

    mockEventSource.simulate('message', {
      stage: 'research-in-progress',
      message: 'Finding the best photography spots in Paris...',
      progress: 15
    });

    await waitFor(() => {
      expect(screen.getByText('Finding the best photography spots in Paris...')).toBeInTheDocument();
    });
  });
});
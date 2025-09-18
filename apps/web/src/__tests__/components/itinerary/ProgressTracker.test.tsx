import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ProgressTracker from '@/components/itinerary/ProgressTracker';
import type { Itinerary } from '@swift-travel/shared';

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

// Mock EventSource
class MockEventSource {
  url: string;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  readyState = EventSource.CONNECTING;
  
  constructor(url: string) {
    this.url = url;
    this.readyState = EventSource.OPEN;
  }
  
  addEventListener(type: string, listener: EventListener) {
    if (type === 'error') {
      this.onerror = listener;
    }
  }
  
  close() {
    this.readyState = EventSource.CLOSED;
  }
  
  // Helper method to simulate events
  simulate(type: string, data: any) {
    if (type === 'message' && this.onmessage) {
      this.onmessage(new MessageEvent('message', { data: JSON.stringify(data) }));
    }
    if (type === 'completed') {
      const event = new Event('completed') as any;
      event.data = JSON.stringify(data);
      if (this.addEventListener) {
        // Simulate the completed event
        const listeners = (this as any)._listeners?.completed || [];
        listeners.forEach((listener: EventListener) => listener(event));
      }
    }
  }
}

global.EventSource = MockEventSource as any;

const mockItinerary: Itinerary = {
  id: 'test-itinerary',
  userId: 'user-1',
  destination: 'Paris, France',
  status: 'finalized',
  activities: [],
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

describe('ProgressTracker', () => {
  let mockEventSource: MockEventSource;
  let onComplete: ReturnType<typeof vi.fn>;
  let onError: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    onComplete = vi.fn();
    onError = vi.fn();
    
    const { createProgressEventSource } = require('@/lib/api/itinerary');
    createProgressEventSource.mockImplementation((requestId: string) => {
      mockEventSource = new MockEventSource(`/progress/${requestId}`);
      return mockEventSource;
    });
  });

  afterEach(() => {
    if (mockEventSource) {
      mockEventSource.close();
    }
  });

  it('renders initial progress state', () => {
    render(
      <ProgressTracker
        requestId="test-request"
        onComplete={onComplete}
        onError={onError}
      />
    );

    expect(screen.getByText('Creating Your Itinerary')).toBeInTheDocument();
    expect(screen.getByText('Initializing...')).toBeInTheDocument();
    expect(screen.getByText('Progress: 0%')).toBeInTheDocument();
    expect(screen.getByText(/Elapsed:/)).toBeInTheDocument();
  });

  it('displays all progress steps', () => {
    render(
      <ProgressTracker
        requestId="test-request"
        onComplete={onComplete}
        onError={onError}
      />
    );

    // Check that all progress steps are visible
    expect(screen.getByText('Getting Started')).toBeInTheDocument();
    expect(screen.getByText('Research')).toBeInTheDocument();
    expect(screen.getByText('Curation')).toBeInTheDocument();
    expect(screen.getByText('Validation')).toBeInTheDocument();
    expect(screen.getByText('Finalizing')).toBeInTheDocument();
    expect(screen.getByText('Complete')).toBeInTheDocument();
  });

  it('updates progress when receiving SSE events', async () => {
    render(
      <ProgressTracker
        requestId="test-request"
        onComplete={onComplete}
        onError={onError}
      />
    );

    // Simulate progress update
    mockEventSource.simulate('message', {
      stage: 'research-in-progress',
      message: 'Discovering unique experiences...',
      progress: 25,
      estimatedTimeRemaining: 15
    });

    await waitFor(() => {
      expect(screen.getByText('Discovering unique experiences...')).toBeInTheDocument();
      expect(screen.getByText('Progress: 25%')).toBeInTheDocument();
      expect(screen.getByText('Estimated time remaining: 15s')).toBeInTheDocument();
    });
  });

  it('shows current step as active', async () => {
    render(
      <ProgressTracker
        requestId="test-request"
        onComplete={onComplete}
        onError={onError}
      />
    );

    // Simulate moving to research step
    mockEventSource.simulate('message', {
      stage: 'research-in-progress',
      message: 'Researching destinations...',
      progress: 25
    });

    await waitFor(() => {
      const researchStep = screen.getByText('Research').closest('div');
      expect(researchStep).toHaveClass('text-blue-600');
    });
  });

  it('marks completed steps with checkmarks', async () => {
    render(
      <ProgressTracker
        requestId="test-request"
        onComplete={onComplete}
        onError={onError}
      />
    );

    // Simulate moving to curation step (research would be complete)
    mockEventSource.simulate('message', {
      stage: 'curation-in-progress',
      message: 'Creating your itinerary...',
      progress: 50
    });

    await waitFor(() => {
      // Research step should show checkmark as completed
      const steps = screen.getAllByText('✓');
      expect(steps.length).toBeGreaterThan(0);
    });
  });

  it('handles completion event and calls onComplete', async () => {
    const { getItinerary } = require('@/lib/api/itinerary');
    getItinerary.mockResolvedValue({
      success: true,
      data: mockItinerary
    });

    render(
      <ProgressTracker
        requestId="test-request"
        onComplete={onComplete}
        onError={onError}
      />
    );

    // Add event listener manually for this test
    const completedListener = vi.fn();
    mockEventSource.addEventListener('completed', completedListener);
    (mockEventSource as any)._listeners = { completed: [completedListener] };

    // Simulate completion
    mockEventSource.simulate('completed', {
      itineraryId: 'test-itinerary',
      message: 'Your itinerary is ready!'
    });

    await waitFor(() => {
      expect(getItinerary).toHaveBeenCalledWith('test-itinerary');
      expect(onComplete).toHaveBeenCalledWith(mockItinerary);
    });
  });

  it('handles SSE errors and calls onError', async () => {
    render(
      <ProgressTracker
        requestId="test-request"
        onComplete={onComplete}
        onError={onError}
      />
    );

    // Simulate error
    if (mockEventSource.onerror) {
      mockEventSource.onerror(new Event('error'));
    }

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('Connection lost. Please refresh the page to check status.');
    });
  });

  it('displays estimated time remaining when provided', async () => {
    render(
      <ProgressTracker
        requestId="test-request"
        onComplete={onComplete}
        onError={onError}
      />
    );

    mockEventSource.simulate('message', {
      stage: 'research-in-progress',
      message: 'Researching...',
      progress: 25,
      estimatedTimeRemaining: 90
    });

    await waitFor(() => {
      expect(screen.getByText('Estimated time remaining: 1m 30s')).toBeInTheDocument();
    });
  });

  it('formats elapsed time correctly', async () => {
    const startTime = Date.now();
    
    render(
      <ProgressTracker
        requestId="test-request"
        onComplete={onComplete}
        onError={onError}
      />
    );

    // Wait a bit for elapsed time to update
    await new Promise(resolve => setTimeout(resolve, 100));

    await waitFor(() => {
      const elapsedElement = screen.getByText(/Elapsed:/);
      expect(elapsedElement).toBeInTheDocument();
      expect(elapsedElement.textContent).toMatch(/Elapsed: \d+s/);
    });
  });

  it('handles malformed SSE data gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(
      <ProgressTracker
        requestId="test-request"
        onComplete={onComplete}
        onError={onError}
      />
    );

    // Simulate malformed data
    if (mockEventSource.onmessage) {
      mockEventSource.onmessage(new MessageEvent('message', { data: 'invalid json' }));
    }

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to parse progress event:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it('tracks performance events', async () => {
    const { performanceMonitoring } = require('@/lib/monitoring');
    
    render(
      <ProgressTracker
        requestId="test-request"
        onComplete={onComplete}
        onError={onError}
      />
    );

    mockEventSource.simulate('message', {
      stage: 'research-in-progress',
      message: 'Researching...',
      progress: 25
    });

    await waitFor(() => {
      expect(performanceMonitoring.trackEvent).toHaveBeenCalledWith('progress_update', {
        category: 'itinerary_generation',
        stage: 'research-in-progress',
        progress: 25,
        requestId: 'test-request'
      });
    });
  });
});
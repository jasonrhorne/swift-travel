import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePerformanceMetrics } from '@/hooks/usePerformanceMetrics';
import { performanceMonitoring } from '@/lib/monitoring';

vi.mock('@/lib/monitoring', () => ({
  performanceMonitoring: { trackEvent: vi.fn() },
}));

const options = { eventName: 'itinerary_display', category: 'itinerary' };

describe('usePerformanceMetrics', () => {
  beforeEach(() => vi.clearAllMocks());

  it('exposes tracking helpers', () => {
    const { result } = renderHook(() => usePerformanceMetrics(options));
    expect(result.current.trackSuccess).toBeTypeOf('function');
    expect(result.current.trackError).toBeTypeOf('function');
    expect(result.current.trackCustom).toBeTypeOf('function');
  });

  it('tracks success once with metadata', () => {
    const { result } = renderHook(() => usePerformanceMetrics(options));
    act(() => {
      result.current.trackSuccess({ itineraryId: 'test-itinerary' });
      result.current.trackSuccess();
    });
    expect(performanceMonitoring.trackEvent).toHaveBeenCalledTimes(1);
    expect(performanceMonitoring.trackEvent).toHaveBeenCalledWith(
      'itinerary_display',
      expect.objectContaining({
        category: 'itinerary',
        status: 'success',
        itineraryId: 'test-itinerary',
      })
    );
  });

  it('tracks errors with context', () => {
    const { result } = renderHook(() => usePerformanceMetrics(options));
    act(() =>
      result.current.trackError('Load failed', { requestId: 'request-1' })
    );
    expect(performanceMonitoring.trackEvent).toHaveBeenCalledWith(
      'itinerary_display',
      expect.objectContaining({
        status: 'error',
        error: 'Load failed',
        requestId: 'request-1',
      })
    );
  });
});

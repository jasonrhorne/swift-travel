import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePerformanceMetrics } from '@/hooks/usePerformanceMetrics';

// Mock the monitoring module
vi.mock('@/lib/monitoring', () => ({
  performanceMonitoring: {
    trackEvent: vi.fn(),
    trackError: vi.fn(),
    trackTiming: vi.fn()
  }
}));

describe('usePerformanceMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides trackItineraryMetrics function', () => {
    const { result } = renderHook(() => usePerformanceMetrics());
    
    expect(result.current.trackItineraryMetrics).toBeDefined();
    expect(typeof result.current.trackItineraryMetrics).toBe('function');
  });

  it('provides trackError function', () => {
    const { result } = renderHook(() => usePerformanceMetrics());
    
    expect(result.current.trackError).toBeDefined();
    expect(typeof result.current.trackError).toBe('function');
  });

  it('provides trackSuccess function', () => {
    const { result } = renderHook(() => usePerformanceMetrics());
    
    expect(result.current.trackSuccess).toBeDefined();
    expect(typeof result.current.trackSuccess).toBe('function');
  });

  it('tracks itinerary metrics correctly', () => {
    const { performanceMonitoring } = require('@/lib/monitoring');
    const { result } = renderHook(() => usePerformanceMetrics());

    act(() => {
      result.current.trackItineraryMetrics('test-itinerary', {
        status: 'finalized',
        activityCount: 5,
        processingTime: 25
      });
    });

    expect(performanceMonitoring.trackEvent).toHaveBeenCalledWith('itinerary_metrics', {
      category: 'itinerary_generation',
      itineraryId: 'test-itinerary',
      status: 'finalized',
      activityCount: 5,
      processingTime: 25
    });
  });

  it('tracks errors with context', () => {
    const { performanceMonitoring } = require('@/lib/monitoring');
    const { result } = renderHook(() => usePerformanceMetrics());

    act(() => {
      result.current.trackError('validation_failed', {
        itineraryId: 'test-itinerary',
        agent: 'validation',
        error: 'Location not found'
      });
    });

    expect(performanceMonitoring.trackError).toHaveBeenCalledWith('validation_failed', {
      category: 'itinerary_generation',
      itineraryId: 'test-itinerary',
      agent: 'validation',
      error: 'Location not found'
    });
  });

  it('tracks success events with metadata', () => {
    const { performanceMonitoring } = require('@/lib/monitoring');
    const { result } = renderHook(() => usePerformanceMetrics());

    act(() => {
      result.current.trackSuccess('itinerary_completed', {
        itineraryId: 'test-itinerary',
        duration: 23,
        qualityScore: 0.95
      });
    });

    expect(performanceMonitoring.trackEvent).toHaveBeenCalledWith('itinerary_completed', {
      category: 'itinerary_generation',
      success: true,
      itineraryId: 'test-itinerary',
      duration: 23,
      qualityScore: 0.95
    });
  });

  it('handles missing optional parameters gracefully', () => {
    const { performanceMonitoring } = require('@/lib/monitoring');
    const { result } = renderHook(() => usePerformanceMetrics());

    act(() => {
      result.current.trackItineraryMetrics('test-itinerary');
    });

    expect(performanceMonitoring.trackEvent).toHaveBeenCalledWith('itinerary_metrics', {
      category: 'itinerary_generation',
      itineraryId: 'test-itinerary'
    });
  });

  it('tracks timing events correctly', () => {
    const { performanceMonitoring } = require('@/lib/monitoring');
    const { result } = renderHook(() => usePerformanceMetrics());

    act(() => {
      result.current.trackItineraryMetrics('test-itinerary', {
        status: 'finalized',
        processingTime: 25
      });
    });

    expect(performanceMonitoring.trackTiming).toHaveBeenCalledWith('itinerary_generation_time', 25, {
      itineraryId: 'test-itinerary',
      status: 'finalized'
    });
  });
});
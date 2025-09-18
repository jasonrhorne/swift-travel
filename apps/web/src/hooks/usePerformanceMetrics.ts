'use client';

import { useEffect, useRef } from 'react';
import { performanceMonitoring } from '@/lib/monitoring';

interface UsePerformanceMetricsOptions {
  eventName: string;
  category: string;
  metadata?: Record<string, unknown>;
}

export function usePerformanceMetrics({
  eventName,
  category,
  metadata = {}
}: UsePerformanceMetricsOptions) {
  const startTimeRef = useRef<number>(Date.now());
  const hasTrackedRef = useRef<boolean>(false);

  useEffect(() => {
    // Reset on mount
    startTimeRef.current = Date.now();
    hasTrackedRef.current = false;
  }, []);

  const trackSuccess = (additionalMetadata?: Record<string, unknown>) => {
    if (hasTrackedRef.current) return;
    
    const duration = Date.now() - startTimeRef.current;
    
    performanceMonitoring.trackEvent(eventName, {
      category,
      status: 'success',
      duration,
      ...metadata,
      ...additionalMetadata
    });
    
    hasTrackedRef.current = true;
  };

  const trackError = (error: string, additionalMetadata?: Record<string, unknown>) => {
    if (hasTrackedRef.current) return;
    
    const duration = Date.now() - startTimeRef.current;
    
    performanceMonitoring.trackEvent(eventName, {
      category,
      status: 'error',
      duration,
      error,
      ...metadata,
      ...additionalMetadata
    });
    
    hasTrackedRef.current = true;
  };

  const trackCustom = (customMetadata: Record<string, unknown>) => {
    const duration = Date.now() - startTimeRef.current;
    
    performanceMonitoring.trackEvent(eventName, {
      category,
      duration,
      ...metadata,
      ...customMetadata
    });
  };

  const getDuration = () => {
    return Date.now() - startTimeRef.current;
  };

  const reset = () => {
    startTimeRef.current = Date.now();
    hasTrackedRef.current = false;
  };

  return {
    trackSuccess,
    trackError,
    trackCustom,
    getDuration,
    reset
  };
}

// Specialized hook for itinerary-related metrics
export function useItineraryMetrics(itineraryId: string) {
  const displayMetrics = usePerformanceMetrics({
    eventName: 'itinerary_display',
    category: 'itinerary',
    metadata: { itineraryId }
  });

  const progressMetrics = usePerformanceMetrics({
    eventName: 'itinerary_progress_tracking',
    category: 'itinerary', 
    metadata: { itineraryId }
  });

  const trackItineraryLoad = (success: boolean, metadata?: Record<string, unknown>) => {
    if (success) {
      displayMetrics.trackSuccess(metadata);
    } else {
      displayMetrics.trackError('Failed to load itinerary', metadata);
    }
  };

  const trackProgressComplete = (totalDuration: number, metadata?: Record<string, unknown>) => {
    progressMetrics.trackSuccess({
      totalGenerationTime: totalDuration,
      ...metadata
    });
  };

  const trackProgressError = (error: string, metadata?: Record<string, unknown>) => {
    progressMetrics.trackError(error, metadata);
  };

  return {
    displayMetrics,
    progressMetrics,
    trackItineraryLoad,
    trackProgressComplete,
    trackProgressError
  };
}
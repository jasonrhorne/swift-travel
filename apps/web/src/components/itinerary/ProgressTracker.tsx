'use client';

import { useEffect, useState } from 'react';
import type { Itinerary, ProcessingStatus } from '@swift-travel/shared';
import { getItinerary, getItineraryRequestStatus } from '@/lib/api/itinerary';
import { performanceMonitoring } from '@/lib/monitoring';

interface ProgressTrackerProps {
  requestId: string;
  onComplete?: (itinerary: Itinerary) => void;
  onError?: (error: string) => void;
}

const labels: Partial<Record<ProcessingStatus, string>> = {
  initiated: 'Getting started...',
  'research-in-progress': 'Researching activities...',
  'research-completed': 'Research complete',
  'curation-in-progress': 'Curating activities...',
  'curation-completed': 'Curation complete',
  'validation-in-progress': 'Validating recommendations...',
  'validation-completed': 'Validation complete',
  'response-in-progress': 'Finalizing itinerary...',
  completed: 'Your itinerary is ready!',
  failed: 'Itinerary generation failed',
};

export default function ProgressTracker({
  requestId,
  onComplete = () => undefined,
  onError = () => undefined,
}: ProgressTrackerProps) {
  const [status, setStatus] = useState<ProcessingStatus>('initiated');
  const [progress, setProgress] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<
    number | null
  >(null);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const poll = async () => {
      let response;
      try {
        response = await getItineraryRequestStatus(requestId);
      } catch {
        if (active) onError('Failed to check itinerary progress');
        return;
      }
      if (!active) return;

      if (!response?.success || !response.data) {
        const message =
          response?.error?.message || 'Failed to check itinerary progress';
        onError(message);
        return;
      }

      const nextStatus = response.data.status as ProcessingStatus;
      setStatus(nextStatus);
      setProgress(response.data.progress);
      setEstimatedTimeRemaining(response.data.estimatedTimeRemaining);
      performanceMonitoring.trackEvent('progress_update', {
        category: 'itinerary_generation',
        stage: nextStatus,
        progress: response.data.progress,
        requestId,
      });

      if (nextStatus === 'failed') {
        onError('Itinerary generation failed');
        return;
      }

      if (nextStatus === 'completed') {
        if (!response.data.itineraryId) {
          onError('Completed request is missing an itinerary');
          return;
        }
        const itineraryResponse = await getItinerary(response.data.itineraryId);
        if (active && itineraryResponse.success && itineraryResponse.data) {
          onComplete(itineraryResponse.data);
        } else if (active) {
          onError('Failed to retrieve completed itinerary');
        }
        return;
      }

      timer = setTimeout(poll, 2000);
    };

    void poll();
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [requestId, onComplete, onError]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold text-gray-900">
          Creating Your Itinerary
        </h2>
        <p className="text-gray-600">{labels[status]}</p>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Progress: {Math.round(progress)}%</span>
          {estimatedTimeRemaining !== null && (
            <span>Estimated time remaining: {estimatedTimeRemaining}s</span>
          )}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

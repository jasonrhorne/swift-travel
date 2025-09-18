'use client';

import { useEffect, useState, useRef } from 'react';
import type { Itinerary, ProcessingStatus } from '@swift-travel/shared';
import { createProgressEventSource, type ProgressEvent } from '@/lib/api/itinerary';
import { performanceMonitoring } from '@/lib/monitoring';

interface ProgressTrackerProps {
  requestId: string;
  onComplete: (itinerary: Itinerary) => void;
  onError: (error: string) => void;
}

interface ProgressStep {
  id: ProcessingStatus;
  label: string;
  description: string;
}

const PROGRESS_STEPS: ProgressStep[] = [
  {
    id: 'initiated',
    label: 'Getting Started',
    description: 'Initializing your itinerary generation...'
  },
  {
    id: 'research-in-progress',
    label: 'Research',
    description: 'Discovering unique experiences and local insights...'
  },
  {
    id: 'research-completed',
    label: 'Research Complete',
    description: 'Research complete. Starting curation...'
  },
  {
    id: 'curation-in-progress',
    label: 'Curation',
    description: 'Creating your personalized itinerary...'
  },
  {
    id: 'curation-completed',
    label: 'Curation Complete',
    description: 'Curation complete. Validating recommendations...'
  },
  {
    id: 'validation-in-progress',
    label: 'Validation',
    description: 'Verifying locations and availability...'
  },
  {
    id: 'validation-completed',
    label: 'Validation Complete',
    description: 'Validation complete. Preparing final itinerary...'
  },
  {
    id: 'response-in-progress',
    label: 'Finalizing',
    description: 'Formatting your beautiful itinerary...'
  },
  {
    id: 'completed',
    label: 'Complete',
    description: 'Your personalized itinerary is ready!'
  }
];

export default function ProgressTracker({ requestId, onComplete, onError }: ProgressTrackerProps) {
  const [currentStep, setCurrentStep] = useState<ProcessingStatus>('initiated');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('Initializing...');
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null);
  const [startTime] = useState(Date.now());
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Create EventSource for real-time updates
    try {
      const eventSource = createProgressEventSource(requestId);
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const data: ProgressEvent = JSON.parse(event.data);
          
          setCurrentStep(data.stage);
          setProgress(data.progress);
          setMessage(data.message);
          
          if (data.estimatedTimeRemaining) {
            setEstimatedTimeRemaining(data.estimatedTimeRemaining);
          }
          
          // Track progress updates
          performanceMonitoring.trackEvent('progress_update', {
            category: 'itinerary_generation',
            stage: data.stage,
            progress: data.progress,
            requestId
          });
        } catch (err) {
          console.error('Failed to parse progress event:', err);
        }
      };

      eventSource.addEventListener('completed', (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.itineraryId) {
            // Fetch the completed itinerary
            import('@/lib/api/itinerary').then(({ getItinerary }) => {
              getItinerary(data.itineraryId).then((response) => {
                if (response.success && response.data) {
                  onComplete(response.data);
                } else {
                  onError('Failed to retrieve completed itinerary');
                }
              });
            });
          }
        } catch (err) {
          console.error('Failed to parse completion event:', err);
          onError('Failed to process completion event');
        }
      });

      eventSource.addEventListener('error', (event) => {
        console.error('EventSource error:', event);
        
        // Track SSE errors
        performanceMonitoring.trackEvent('progress_error', {
          category: 'itinerary_generation',
          error: 'EventSource connection error',
          requestId
        });
        
        onError('Connection lost. Please refresh the page to check status.');
      });

      eventSource.onerror = (event) => {
        console.error('EventSource connection error:', event);
        // Retry connection after a delay
        setTimeout(() => {
          if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
            eventSourceRef.current = createProgressEventSource(requestId);
          }
        }, 5000);
      };

    } catch (err) {
      console.error('Failed to create EventSource:', err);
      onError('Failed to connect to progress updates');
    }

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [requestId, onComplete, onError]);

  const getCurrentStepIndex = () => {
    return PROGRESS_STEPS.findIndex(step => step.id === currentStep);
  };

  const getElapsedTime = () => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
  };

  const formatTimeRemaining = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold text-gray-900">
          Creating Your Itinerary
        </h2>
        <p className="text-gray-600">{message}</p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Progress: {Math.round(progress)}%</span>
          <span>Elapsed: {getElapsedTime()}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        {estimatedTimeRemaining && (
          <div className="text-center text-sm text-gray-600">
            Estimated time remaining: {formatTimeRemaining(estimatedTimeRemaining)}
          </div>
        )}
      </div>

      {/* Step Indicators */}
      <div className="space-y-3">
        {PROGRESS_STEPS.map((step, index) => {
          const currentIndex = getCurrentStepIndex();
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isPending = index > currentIndex;

          return (
            <div key={step.id} className="flex items-center space-x-3">
              {/* Step Icon */}
              <div className={`
                flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
                ${isCompleted ? 'bg-green-500 text-white' : ''}
                ${isCurrent ? 'bg-blue-500 text-white animate-pulse' : ''}
                ${isPending ? 'bg-gray-200 text-gray-500' : ''}
              `}>
                {isCompleted ? '✓' : index + 1}
              </div>
              
              {/* Step Content */}
              <div className={`
                flex-1 text-sm
                ${isCurrent ? 'text-blue-600 font-medium' : ''}
                ${isCompleted ? 'text-green-600' : ''}
                ${isPending ? 'text-gray-500' : ''}
              `}>
                <div className="font-medium">{step.label}</div>
                {isCurrent && (
                  <div className="text-xs text-gray-600 mt-1">
                    {step.description}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Agents Info */}
      <div className="bg-blue-50 rounded-lg p-4 text-center">
        <p className="text-sm text-blue-700">
          Our AI agents are working together to create your perfect itinerary.
          This process typically takes 15-30 seconds.
        </p>
      </div>
    </div>
  );
}
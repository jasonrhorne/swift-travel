'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Itinerary } from '@swift-travel/shared';
import { getItinerary } from '@/lib/api/itinerary';
import ProgressTracker from './ProgressTracker';
import ItineraryCard from './ItineraryCard';
import ErrorBoundary from './ErrorBoundary';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useItineraryMetrics } from '@/hooks/usePerformanceMetrics';

interface ItineraryDisplayProps {
  itineraryId: string;
}

export default function ItineraryDisplay({ itineraryId }: ItineraryDisplayProps) {
  const router = useRouter();
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Performance monitoring
  const { trackItineraryLoad, trackProgressComplete } = useItineraryMetrics(itineraryId);

  useEffect(() => {
    const fetchItinerary = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await getItinerary(itineraryId);
        
        if (response.success && response.data) {
          setItinerary(response.data);
          
          // Track successful load
          trackItineraryLoad(true, {
            status: response.data.status,
            activitiesCount: response.data.activities.length,
            processingTimeSeconds: response.data.metadata?.processingTimeSeconds
          });
          
          // Check if still processing
          if (response.data.status === 'draft' || response.data.status === 'validated') {
            setIsProcessing(true);
          }
        } else {
          const errorMsg = response.error?.message || 'Failed to load itinerary';
          setError(errorMsg);
          
          // Track failed load
          trackItineraryLoad(false, {
            error: errorMsg,
            errorCode: response.error?.code
          });
        }
      } catch (err) {
        setError('An unexpected error occurred while loading the itinerary');
        console.error('Failed to fetch itinerary:', err);
      } finally {
        setLoading(false);
      }
    };

    if (itineraryId) {
      fetchItinerary();
    }
  }, [itineraryId, trackItineraryLoad]);

  const handleProgressComplete = (completedItinerary: Itinerary) => {
    setItinerary(completedItinerary);
    setIsProcessing(false);
    
    // Track progress completion
    trackProgressComplete(
      completedItinerary.metadata?.processingTimeSeconds || 0,
      {
        activitiesCount: completedItinerary.activities.length,
        qualityScore: completedItinerary.metadata?.qualityScore,
        finalStatus: completedItinerary.status
      }
    );
  };

  const handleRetry = () => {
    // Navigate back to requirements form for retry
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-gray-600">Loading your itinerary...</p>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorBoundary
        error={error}
        onRetry={handleRetry}
        title="Failed to Load Itinerary"
      />
    );
  }

  if (!itinerary) {
    return (
      <ErrorBoundary
        error="Itinerary not found"
        onRetry={handleRetry}
        title="Itinerary Not Found"
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">
          Your {itinerary.destination} Itinerary
        </h1>
        {itinerary.persona && (
          <p className="text-lg text-gray-600 capitalize">
            Curated for {itinerary.persona.replace('-', ' ')} enthusiasts
          </p>
        )}
      </div>

      {/* Progress Tracker (if still processing) */}
      {isProcessing && (
        <ProgressTracker
          requestId={itineraryId}
          onComplete={handleProgressComplete}
          onError={(error) => setError(error)}
        />
      )}

      {/* Itinerary Content */}
      {!isProcessing && itinerary.status === 'finalized' && (
        <ItineraryCard itinerary={itinerary} />
      )}

      {/* Processing Status */}
      {!isProcessing && itinerary.status !== 'finalized' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            Itinerary In Progress
          </h3>
          <p className="text-yellow-700 mb-4">
            Your itinerary is being generated. Please wait while our AI agents create your personalized recommendations.
          </p>
          <button
            onClick={() => setIsProcessing(true)}
            className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
          >
            Check Progress
          </button>
        </div>
      )}
    </div>
  );
}
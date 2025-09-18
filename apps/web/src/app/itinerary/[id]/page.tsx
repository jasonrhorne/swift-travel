'use client';

import { useParams } from 'next/navigation';
import { Suspense } from 'react';
import ItineraryDisplay from '@/components/itinerary/ItineraryDisplay';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function ItineraryPage() {
  const params = useParams();
  const itineraryId = params.id as string;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <Suspense fallback={<LoadingSpinner />}>
          <ItineraryDisplay itineraryId={itineraryId} />
        </Suspense>
      </div>
    </div>
  );
}
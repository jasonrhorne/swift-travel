'use client';

import RequirementsIntakeForm from '@/components/forms/RequirementsIntakeForm';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function RequirementsPage() {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  
  // In production, redirect to login if not authenticated
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development' && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Create Your Perfect Itinerary
          </h1>
          <p className="mt-2 text-gray-600">
            Tell us about your travel preferences and we'll generate a personalized itinerary for you.
          </p>
          
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded-lg">
              <p className="text-sm">
                <strong>Dev Mode:</strong> Logged in as {user?.name || 'Development User'} ({user?.email})
              </p>
            </div>
          )}
        </div>
        
        <RequirementsIntakeForm />
      </div>
    </div>
  );
}
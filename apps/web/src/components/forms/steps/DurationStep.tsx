'use client';

import React, { useEffect } from 'react';
import { useRequirementsStore } from '@/stores/requirementsStore';

export default function DurationStep() {
  const { duration, setDuration } = useRequirementsStore();
  
  // Set duration to long-weekend by default
  useEffect(() => {
    if (!duration) {
      setDuration('long-weekend');
    }
  }, [duration, setDuration]);
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Your Trip Duration
        </h2>
        <p className="text-gray-600">
          We'll create the perfect long weekend itinerary for your destination.
        </p>
      </div>
      
      {/* Duration display */}
      <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-indigo-900">
                Long Weekend Getaway
              </h3>
              <p className="text-indigo-700">
                3-4 days of curated experiences
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
              Selected
            </span>
          </div>
        </div>
      </div>
      
      {/* What's included */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">
          What your itinerary will include:
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-gray-900">Day-by-day schedule</p>
              <p className="text-xs text-gray-600">Morning, afternoon & evening activities</p>
            </div>
          </div>
          <div className="flex items-start">
            <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-gray-900">Must-see attractions</p>
              <p className="text-xs text-gray-600">Top sights and hidden gems</p>
            </div>
          </div>
          <div className="flex items-start">
            <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-gray-900">Restaurant recommendations</p>
              <p className="text-xs text-gray-600">Breakfast, lunch & dinner spots</p>
            </div>
          </div>
          <div className="flex items-start">
            <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-gray-900">Local experiences</p>
              <p className="text-xs text-gray-600">Authentic neighborhood activities</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Why long weekends */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-blue-900 mb-1">
              Perfect for Long Weekends
            </h4>
            <p className="text-sm text-blue-700">
              Our itineraries are optimized for 3-4 day trips, ideal for holiday weekends or short getaways. 
              You'll experience the best of your destination without feeling rushed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
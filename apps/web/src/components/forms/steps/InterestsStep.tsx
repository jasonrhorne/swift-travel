'use client';

import React from 'react';
import { useRequirementsStore } from '@/stores/requirementsStore';

// 12 diverse travel interests
const TRAVEL_INTERESTS = [
  { id: 'food', label: 'Food & Dining', icon: '🍽️', description: 'Local cuisine, restaurants, markets' },
  { id: 'art', label: 'Art & Museums', icon: '🎨', description: 'Galleries, exhibits, installations' },
  { id: 'outdoors', label: 'Outdoor Activities', icon: '🥾', description: 'Hiking, parks, nature' },
  { id: 'shopping', label: 'Shopping', icon: '🛍️', description: 'Boutiques, markets, local crafts' },
  { id: 'nightlife', label: 'Nightlife', icon: '🌃', description: 'Bars, clubs, evening entertainment' },
  { id: 'architecture', label: 'Architecture', icon: '🏛️', description: 'Historic buildings, landmarks' },
  { id: 'photography', label: 'Photography', icon: '📸', description: 'Scenic spots, Instagram-worthy' },
  { id: 'wellness', label: 'Wellness & Spa', icon: '🧘', description: 'Relaxation, spa treatments' },
  { id: 'sports', label: 'Sports & Fitness', icon: '⚽', description: 'Games, activities, workouts' },
  { id: 'culture', label: 'Culture & History', icon: '🏺', description: 'Local traditions, historic sites' },
  { id: 'entertainment', label: 'Entertainment', icon: '🎭', description: 'Shows, concerts, performances' },
  { id: 'family', label: 'Family Activities', icon: '👨‍👩‍👧‍👦', description: 'Kid-friendly, all ages' }
];

export default function InterestsStep() {
  const { interests, setInterests, errors } = useRequirementsStore();
  
  const toggleInterest = (interestId: string) => {
    const newInterests = interests.includes(interestId) 
      ? interests.filter(id => id !== interestId)
      : [...interests, interestId];
    setInterests(newInterests);
  };
  
  const hasError = errors.interests;
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          What are your interests?
        </h2>
        <p className="text-gray-600">
          Select all that apply. We'll create an itinerary that matches your travel style.
        </p>
        {interests.length > 0 && (
          <p className="text-sm text-indigo-600 mt-2 font-medium">
            {interests.length} interest{interests.length !== 1 ? 's' : ''} selected
          </p>
        )}
      </div>
      
      {/* Interest grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {TRAVEL_INTERESTS.map((interest) => {
          const isSelected = interests.includes(interest.id);
          return (
            <button
              key={interest.id}
              type="button"
              onClick={() => toggleInterest(interest.id)}
              className={`relative text-left p-4 rounded-lg border-2 transition-all ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              aria-pressed={isSelected}
            >
              <div className="flex items-start">
                <span className="text-2xl mr-3" role="img" aria-label={interest.label}>
                  {interest.icon}
                </span>
                <div className="flex-1">
                  <h3 className={`font-medium ${
                    isSelected ? 'text-indigo-900' : 'text-gray-900'
                  }`}>
                    {interest.label}
                  </h3>
                  <p className={`text-sm mt-0.5 ${
                    isSelected ? 'text-indigo-700' : 'text-gray-600'
                  }`}>
                    {interest.description}
                  </p>
                </div>
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
      
      {/* Error display */}
      {hasError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600" role="alert">
            {hasError}
          </p>
        </div>
      )}
      
      {/* Helpful tip */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-blue-900 mb-1">
              Personalized Recommendations
            </h4>
            <p className="text-sm text-blue-700">
              The more interests you select, the more tailored your itinerary will be. Our AI will prioritize activities that match your preferences while ensuring a balanced experience.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
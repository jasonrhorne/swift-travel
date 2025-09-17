'use client';

import React, { useState } from 'react';
import { useRequirementsStore } from '@/stores/requirementsStore';
import { sanitizeStringInput } from '@swift-travel/shared';

export default function RequestsStep() {
  const {
    specialRequests,
    accessibilityNeeds,
    addSpecialRequest,
    removeSpecialRequest,
    updateSpecialRequest,
    addAccessibilityNeed,
    removeAccessibilityNeed,
    updateAccessibilityNeed,
    errors
  } = useRequirementsStore();
  
  const [newSpecialRequest, setNewSpecialRequest] = useState('');
  const [newAccessibilityNeed, setNewAccessibilityNeed] = useState('');
  
  // Common accessibility options
  const commonAccessibilityNeeds = [
    'Wheelchair accessible venues',
    'Hearing assistance devices',
    'Visual assistance/large print',
    'Step-free access',
    'Accessible restrooms',
    'Reserved seating areas',
    'Service animal friendly',
    'Dietary restrictions accommodations'
  ];
  
  // Handle adding special request
  const handleAddSpecialRequest = () => {
    const sanitized = sanitizeStringInput(newSpecialRequest);
    if (sanitized.length >= 3 && specialRequests.length < 5) {
      addSpecialRequest(sanitized);
      setNewSpecialRequest('');
    }
  };
  
  // Handle adding accessibility need
  const handleAddAccessibilityNeed = () => {
    const sanitized = sanitizeStringInput(newAccessibilityNeed);
    if (sanitized.length >= 3 && accessibilityNeeds.length < 10) {
      addAccessibilityNeed(sanitized);
      setNewAccessibilityNeed('');
    }
  };
  
  // Handle quick add accessibility need
  const handleQuickAddAccessibilityNeed = (need: string) => {
    if (!accessibilityNeeds.includes(need) && accessibilityNeeds.length < 10) {
      addAccessibilityNeed(need);
    }
  };
  
  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      action();
    }
  };
  
  const hasSpecialRequestsError = errors.specialRequests;
  const hasAccessibilityError = errors.accessibilityNeeds;
  
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Special Requests & Accessibility
        </h2>
        <p className="text-gray-600">
          Let us know about any special requirements or accessibility needs so we can ensure your trip is perfect for you.
        </p>
      </div>
      
      {/* Special Requests */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Special Requests <span className="text-sm font-normal text-gray-500">(Optional)</span>
        </h3>
        
        <p className="text-sm text-gray-600 mb-4">
          Any specific interests, celebrations, or unique requests? (e.g., "Anniversary dinner", "Vegetarian restaurants", "Photography workshops")
        </p>
        
        {hasSpecialRequestsError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600" role="alert">
              {hasSpecialRequestsError}
            </p>
          </div>
        )}
        
        {/* Add new special request */}
        <div className="flex space-x-2 mb-4">
          <input
            type="text"
            value={newSpecialRequest}
            onChange={(e) => setNewSpecialRequest(e.target.value)}
            onKeyPress={(e) => handleKeyPress(e, handleAddSpecialRequest)}
            placeholder="Add a special request..."
            maxLength={500}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            disabled={specialRequests.length >= 5}
          />
          <button
            type="button"
            onClick={handleAddSpecialRequest}
            disabled={newSpecialRequest.length < 3 || specialRequests.length >= 5}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Add
          </button>
        </div>
        
        {/* Current special requests */}
        {specialRequests.length > 0 && (
          <div className="space-y-2">
            {specialRequests.map((request, index) => (
              <div key={index} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                <span className="flex-1 text-sm text-gray-900">{request}</span>
                <button
                  type="button"
                  onClick={() => removeSpecialRequest(index)}
                  className="text-red-600 hover:text-red-800 transition-colors"
                  aria-label={`Remove request: ${request}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
        
        <p className="text-xs text-gray-500 mt-2">
          {specialRequests.length}/5 special requests
        </p>
      </div>
      
      {/* Accessibility Needs */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Accessibility Needs <span className="text-sm font-normal text-gray-500">(Optional)</span>
        </h3>
        
        <p className="text-sm text-gray-600 mb-4">
          Help us ensure all recommendations are accessible to everyone in your group.
        </p>
        
        {hasAccessibilityError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600" role="alert">
              {hasAccessibilityError}
            </p>
          </div>
        )}
        
        {/* Quick select common needs */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Common accessibility needs:</h4>
          <div className="flex flex-wrap gap-2">
            {commonAccessibilityNeeds.map((need, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleQuickAddAccessibilityNeed(need)}
                disabled={accessibilityNeeds.includes(need) || accessibilityNeeds.length >= 10}
                className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                  accessibilityNeeds.includes(need)
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed'
                }`}
              >
                {accessibilityNeeds.includes(need) && (
                  <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {need}
              </button>
            ))}
          </div>
        </div>
        
        {/* Add custom accessibility need */}
        <div className="flex space-x-2 mb-4">
          <input
            type="text"
            value={newAccessibilityNeed}
            onChange={(e) => setNewAccessibilityNeed(e.target.value)}
            onKeyPress={(e) => handleKeyPress(e, handleAddAccessibilityNeed)}
            placeholder="Add a custom accessibility need..."
            maxLength={200}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            disabled={accessibilityNeeds.length >= 10}
          />
          <button
            type="button"
            onClick={handleAddAccessibilityNeed}
            disabled={newAccessibilityNeed.length < 3 || accessibilityNeeds.length >= 10}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Add
          </button>
        </div>
        
        {/* Current accessibility needs */}
        {accessibilityNeeds.length > 0 && (
          <div className="space-y-2">
            {accessibilityNeeds.map((need, index) => (
              <div key={index} className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="flex-1 text-sm text-gray-900">{need}</span>
                <button
                  type="button"
                  onClick={() => removeAccessibilityNeed(index)}
                  className="text-red-600 hover:text-red-800 transition-colors"
                  aria-label={`Remove accessibility need: ${need}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
        
        <p className="text-xs text-gray-500 mt-2">
          {accessibilityNeeds.length}/10 accessibility needs
        </p>
      </div>
      
      {/* Final encouragement */}
      <div className="bg-green-50 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-green-900 mb-1">
              Almost Ready!
            </h4>
            <p className="text-sm text-green-700">
              You're all set! Our AI agents will use all this information to create a personalized itinerary that perfectly matches your preferences and needs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
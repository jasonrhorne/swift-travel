'use client';

import React, { useState } from 'react';
import { useRequirementsStore } from '@/stores/requirementsStore';

export default function TravelersStep() {
  const { 
    groupSize, 
    setGroupSize, 
    travelerComposition,
    setTravelerComposition,
    errors 
  } = useRequirementsStore();
  
  const [adults, setAdults] = useState(travelerComposition?.adults || 2);
  const [children, setChildren] = useState(travelerComposition?.children || 0);
  const [childrenAges, setChildrenAges] = useState<number[]>(
    travelerComposition?.childrenAges || []
  );
  
  const handleAdultsChange = (value: number) => {
    if (value >= 1 && value <= 10) {
      setAdults(value);
      const newGroupSize = value + children;
      setGroupSize(newGroupSize);
      setTravelerComposition({
        adults: value,
        children,
        childrenAges
      });
    }
  };
  
  const handleChildrenChange = (value: number) => {
    if (value >= 0 && value <= 10) {
      setChildren(value);
      const newGroupSize = adults + value;
      setGroupSize(newGroupSize);
      
      // Adjust children ages array
      const newAges = [...childrenAges];
      if (value > childrenAges.length) {
        // Add default ages for new children
        for (let i = childrenAges.length; i < value; i++) {
          newAges.push(10); // Default age
        }
      } else {
        // Trim ages array if reducing children
        newAges.length = value;
      }
      setChildrenAges(newAges);
      
      setTravelerComposition({
        adults,
        children: value,
        childrenAges: newAges
      });
    }
  };
  
  const handleChildAgeChange = (index: number, age: number) => {
    if (age >= 0 && age <= 17) {
      const newAges = [...childrenAges];
      newAges[index] = age;
      setChildrenAges(newAges);
      
      setTravelerComposition({
        adults,
        children,
        childrenAges: newAges
      });
    }
  };
  
  const getTravelerSummary = () => {
    const parts = [];
    if (adults === 1) parts.push('1 adult');
    if (adults > 1) parts.push(`${adults} adults`);
    if (children === 1) parts.push('1 child');
    if (children > 1) parts.push(`${children} children`);
    return parts.join(', ');
  };
  
  const hasError = errors.travelerComposition || errors.groupSize;
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Who's traveling?
        </h2>
        <p className="text-gray-600">
          Tell us about your travel group so we can recommend appropriate activities.
        </p>
      </div>
      
      {/* Adults selector */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Adults (18+) *
          </label>
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => handleAdultsChange(Math.max(1, adults - 1))}
              className="w-10 h-10 rounded-full border-2 border-gray-300 hover:border-indigo-500 flex items-center justify-center transition-colors"
              aria-label="Decrease adults"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            
            <div className="w-20 text-center">
              <span className="text-2xl font-semibold text-gray-900">{adults}</span>
            </div>
            
            <button
              type="button"
              onClick={() => handleAdultsChange(Math.min(10, adults + 1))}
              className="w-10 h-10 rounded-full border-2 border-gray-300 hover:border-indigo-500 flex items-center justify-center transition-colors"
              aria-label="Increase adults"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Children selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Children (0-17)
          </label>
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => handleChildrenChange(Math.max(0, children - 1))}
              className="w-10 h-10 rounded-full border-2 border-gray-300 hover:border-indigo-500 flex items-center justify-center transition-colors"
              aria-label="Decrease children"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            
            <div className="w-20 text-center">
              <span className="text-2xl font-semibold text-gray-900">{children}</span>
            </div>
            
            <button
              type="button"
              onClick={() => handleChildrenChange(Math.min(10, children + 1))}
              className="w-10 h-10 rounded-full border-2 border-gray-300 hover:border-indigo-500 flex items-center justify-center transition-colors"
              aria-label="Increase children"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Children ages */}
        {children > 0 && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Children ages (at time of travel)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Array.from({ length: children }).map((_, index) => (
                <div key={index} className="flex flex-col">
                  <label htmlFor={`child-age-${index}`} className="text-xs text-gray-600 mb-1">
                    Child {index + 1}
                  </label>
                  <input
                    type="number"
                    id={`child-age-${index}`}
                    value={childrenAges[index] || 10}
                    onChange={(e) => handleChildAgeChange(index, parseInt(e.target.value, 10))}
                    min="0"
                    max="17"
                    className="px-3 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Knowing children's ages helps us recommend age-appropriate activities
            </p>
          </div>
        )}
      </div>
      
      {/* Travel group summary */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-indigo-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-indigo-900">
              Travel Group: {getTravelerSummary()}
            </h4>
            <p className="text-sm text-indigo-700 mt-0.5">
              Total of {groupSize} traveler{groupSize !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>
      
      {/* Error display */}
      {hasError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600" role="alert">
            {hasError}
          </p>
        </div>
      )}
      
      {/* Family-friendly tip for groups with children */}
      {children > 0 && (
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-blue-900 mb-1">
                Family-Friendly Itinerary
              </h4>
              <p className="text-sm text-blue-700">
                We'll prioritize family-friendly activities, restaurants with kids' menus, and attractions suitable for 
                {children === 1 
                  ? ` your ${childrenAges[0]}-year-old.`
                  : ` children aged ${childrenAges.join(', ')}.`
                }
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
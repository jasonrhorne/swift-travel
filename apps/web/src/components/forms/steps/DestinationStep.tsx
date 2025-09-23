'use client';

import React, { useState, useEffect } from 'react';
import { useRequirementsStore } from '@/stores/requirementsStore';
import { 
  sanitizeStringInput,
  POPULAR_DESTINATIONS, 
  getDestinationSuggestions,
  isValidNorthAmericanDestination,
  type Destination 
} from '@swift-travel/shared';

export default function DestinationStep() {
  const { destination, setDestination, errors, setFieldError, clearFieldError } = useRequirementsStore();
  const [localValue, setLocalValue] = useState(destination);
  const [suggestions, setSuggestions] = useState<Destination[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Update local value when store changes
  useEffect(() => {
    setLocalValue(destination);
  }, [destination]);
  
  // Handle input change with debouncing and validation
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const sanitized = sanitizeStringInput(localValue);
      if (sanitized !== destination) {
        setDestination(sanitized);
        
        // Validate destination is in US/Canada
        if (sanitized && !isValidNorthAmericanDestination(sanitized)) {
          setFieldError('destination', 'Please select a destination in the United States or Canada');
        } else {
          clearFieldError('destination');
        }
      }
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [localValue, destination, setDestination, setFieldError, clearFieldError]);
  
  // Handle suggestion filtering
  useEffect(() => {
    if (localValue.length >= 2) {
      const filtered = getDestinationSuggestions(localValue);
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [localValue]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  };
  
  const handleSuggestionClick = (suggestion: string) => {
    setLocalValue(suggestion);
    setDestination(suggestion);
    clearFieldError('destination'); // Clear any validation errors
    setShowSuggestions(false);
  };
  
  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };
  
  const handleInputBlur = () => {
    // Delay hiding suggestions to allow clicking
    setTimeout(() => setShowSuggestions(false), 200);
  };
  
  const hasError = errors.destination;
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Where would you like to go?
        </h2>
        <p className="text-gray-600">
          Choose your destination in the United States or Canada for the perfect long weekend getaway.
        </p>
      </div>
      
      <div className="relative">
        <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-2">
          Destination *
        </label>
        
        <div className="relative">
          <input
            type="text"
            id="destination"
            value={localValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder="e.g., New York City, NY or Vancouver, BC"
            className={`w-full px-4 py-3 border rounded-lg text-lg placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
              hasError 
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                : 'border-gray-300'
            }`}
            aria-invalid={hasError ? 'true' : 'false'}
            aria-describedby={hasError ? 'destination-error' : undefined}
          />
          
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>
        
        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSuggestionClick(suggestion.displayName)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none first:rounded-t-lg last:rounded-b-lg"
              >
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-gray-900">{suggestion.displayName}</span>
                  <span className="ml-2 text-sm text-gray-500">
                    {suggestion.country === 'USA' ? '🇺🇸' : '🇨🇦'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
        
        {hasError && (
          <p id="destination-error" className="mt-2 text-sm text-red-600" role="alert">
            {hasError}
          </p>
        )}
      </div>
      
      {/* Popular destinations */}
      {!localValue && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Popular destinations:</h3>
          <div className="flex flex-wrap gap-2">
            {POPULAR_DESTINATIONS.map((dest, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSuggestionClick(dest)}
                className="px-3 py-1.5 text-sm text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
              >
                {dest}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Value proposition */}
      <div className="bg-indigo-50 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-indigo-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-indigo-900 mb-1">
              AI-Powered Planning
            </h4>
            <p className="text-sm text-indigo-700">
              Our specialized AI agents will research your destination, curate personalized activities, and validate all recommendations to ensure an amazing trip.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
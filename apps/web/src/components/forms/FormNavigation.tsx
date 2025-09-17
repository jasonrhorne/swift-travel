'use client';

import React from 'react';

interface FormNavigationProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  canGoNext: boolean;
}

export default function FormNavigation({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  onSubmit,
  isSubmitting,
  canGoNext
}: FormNavigationProps) {
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;
  
  return (
    <div className="bg-gray-50 px-6 py-4 md:px-8">
      <div className="flex items-center justify-between">
        {/* Previous button */}
        <button
          type="button"
          onClick={onPrevious}
          disabled={isFirstStep || isSubmitting}
          className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            isFirstStep || isSubmitting
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
          }`}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Previous
        </button>
        
        {/* Step indicator */}
        <div className="text-sm text-gray-500">
          {currentStep + 1} of {totalSteps}
        </div>
        
        {/* Next/Submit button */}
        {isLastStep ? (
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className={`flex items-center px-6 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
              isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
            }`}
          >
            {isSubmitting ? (
              <>
                <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Itinerary...
              </>
            ) : (
              <>
                Create My Itinerary
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={onNext}
            disabled={!canGoNext || isSubmitting}
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              !canGoNext || isSubmitting
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
            }`}
          >
            Next
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
      
      {/* Additional help text */}
      <div className="mt-3 text-center">
        <p className="text-xs text-gray-500">
          {isLastStep 
            ? 'Review your information and submit to begin itinerary generation'
            : 'Complete this step to continue'
          }
        </p>
      </div>
    </div>
  );
}
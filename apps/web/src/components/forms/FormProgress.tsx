'use client';

import React from 'react';

interface FormProgressProps {
  currentStep: number;
  totalSteps: number;
  completionPercentage: number;
  onStepClick: (step: number) => void;
}

const stepLabels = [
  'Destination',
  'Dates',
  'Style',
  'Preferences',
  'Requests'
];

export default function FormProgress({ 
  currentStep, 
  totalSteps, 
  completionPercentage, 
  onStepClick 
}: FormProgressProps) {
  return (
    <div className="mb-8">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progress</span>
          <span>{completionPercentage}% complete</span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-indigo-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${(currentStep + 1) / totalSteps * 100}%` }}
          />
        </div>
      </div>
      
      {/* Step indicators */}
      <div className="hidden sm:block">
        <nav aria-label="Progress steps">
          <ol className="flex items-center justify-between">
            {stepLabels.map((label, index) => {
              const isCompleted = index < currentStep;
              const isCurrent = index === currentStep;
              const isClickable = index <= currentStep;
              
              return (
                <li key={label} className="flex items-center">
                  <button
                    type="button"
                    onClick={() => isClickable && onStepClick(index)}
                    disabled={!isClickable}
                    className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-200 ${
                      isCompleted
                        ? 'bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700 hover:border-indigo-700'
                        : isCurrent
                        ? 'bg-white border-indigo-600 text-indigo-600'
                        : 'bg-white border-gray-300 text-gray-400'
                    } ${
                      isClickable ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2' : 'cursor-not-allowed'
                    }`}
                    aria-current={isCurrent ? 'step' : undefined}
                    aria-label={`${label} step${isCompleted ? ' - completed' : isCurrent ? ' - current' : ''}`}
                  >
                    {isCompleted ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="text-sm font-medium">{index + 1}</span>
                    )}
                  </button>
                  
                  <div className="ml-3 min-w-0">
                    <p className={`text-sm font-medium ${
                      isCurrent ? 'text-indigo-600' : isCompleted ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {label}
                    </p>
                  </div>
                  
                  {/* Connector line */}
                  {index < totalSteps - 1 && (
                    <div className="hidden lg:block ml-4 w-12 h-0.5 bg-gray-300 flex-shrink-0" />
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      </div>
      
      {/* Mobile step indicator */}
      <div className="sm:hidden">
        <div className="flex items-center justify-center space-x-2">
          {Array.from({ length: totalSteps }).map((_, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            
            return (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  isCompleted
                    ? 'bg-indigo-600'
                    : isCurrent
                    ? 'bg-indigo-400'
                    : 'bg-gray-300'
                }`}
                aria-hidden="true"
              />
            );
          })}
        </div>
        
        <p className="text-center text-sm text-gray-600 mt-2">
          Step {currentStep + 1} of {totalSteps}: {stepLabels[currentStep]}
        </p>
      </div>
    </div>
  );
}
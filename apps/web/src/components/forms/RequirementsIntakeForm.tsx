'use client';

import React, { useState } from 'react';
import { useRequirementsStore } from '@/stores/requirementsStore';
import { 
  userRequirementsSchema,
  destinationStepSchema,
  datesStepSchema,
  personaStepSchema,
  preferencesStepSchema,
  requestsStepSchema,
  formatValidationError
} from '@swift-travel/shared';
import { submitItineraryRequirements } from '@/lib/api/itinerary';
import { z } from 'zod';

// Form step components
import DestinationStep from './steps/DestinationStep';
import DatesStep from './steps/DatesStep'; 
import PersonaStep from './steps/PersonaStep';
import PreferencesStep from './steps/PreferencesStep';
import RequestsStep from './steps/RequestsStep';

// Progress component
import FormProgress from './FormProgress';

// Navigation component
import FormNavigation from './FormNavigation';

export default function RequirementsIntakeForm() {
  const {
    // Form state
    currentStep,
    totalSteps,
    isSubmitting,
    submitError,
    errors,
    
    // Form data
    destination,
    persona,
    dates,
    budgetRange,
    groupSize,
    specialRequests,
    accessibilityNeeds,
    
    // Actions
    nextStep,
    previousStep,
    goToStep,
    setErrors,
    clearErrors,
    setSubmitting,
    setSubmitError,
    exportUserRequirements,
    getCompletionPercentage,
    isStepValid,
  } = useRequirementsStore();
  
  const [showSuccess, setShowSuccess] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  
  // Step validation schemas
  const stepSchemas = [
    destinationStepSchema,
    datesStepSchema,
    personaStepSchema,
    preferencesStepSchema,
    requestsStepSchema,
  ];
  
  // Step data getters
  const getStepData = (step: number) => {
    switch (step) {
      case 0:
        return { destination };
      case 1:
        return { dates };
      case 2:
        return { persona };
      case 3:
        return { budgetRange, groupSize };
      case 4:
        return { specialRequests, accessibilityNeeds };
      default:
        return {};
    }
  };
  
  // Validate current step
  const validateCurrentStep = (): boolean => {
    const stepData = getStepData(currentStep);
    const schema = stepSchemas[currentStep];
    
    try {
      schema.parse(stepData);
      clearErrors();
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors = formatValidationError(error);
        setErrors(formattedErrors);
      }
      return false;
    }
  };
  
  // Handle next step
  const handleNext = () => {
    if (validateCurrentStep()) {
      nextStep();
    }
  };
  
  // Handle previous step
  const handlePrevious = () => {
    clearErrors();
    previousStep();
  };
  
  // Handle step navigation from progress bar
  const handleStepClick = (step: number) => {
    if (step <= currentStep || isStepValid(step)) {
      clearErrors();
      goToStep(step);
    }
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    // Start performance monitoring
    const startTime = performance.now();
    
    // Validate entire form
    const userRequirements = exportUserRequirements();
    
    if (!userRequirements) {
      setSubmitError('Please complete all required fields before submitting.');
      return;
    }
    
    try {
      userRequirementsSchema.parse(userRequirements);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors = formatValidationError(error);
        setErrors(formattedErrors);
        setSubmitError('Please fix the validation errors before submitting.');
        return;
      }
    }
    
    setSubmitting(true);
    setSubmitError(null);
    
    try {
      const response = await submitItineraryRequirements(userRequirements);
      
      // Calculate performance metrics
      const endTime = performance.now();
      const submissionTime = endTime - startTime;
      
      // Log performance metrics (meets <2s target validation)
      if (submissionTime > 2000) {
        console.warn(`Form submission took ${submissionTime.toFixed(2)}ms - exceeds 2s target`);
      } else {
        console.log(`Form submission completed in ${submissionTime.toFixed(2)}ms`);
      }
      
      // Optional: Send performance metrics to monitoring service
      if (typeof window !== 'undefined' && 'gtag' in window) {
        (window as { gtag: (command: string, eventName: string, parameters: Record<string, unknown>) => void }).gtag('event', 'form_submission_performance', {
          event_category: 'performance',
          event_label: 'requirements_form',
          value: Math.round(submissionTime),
          custom_parameter_timing: submissionTime,
        });
      }
      
      if (response.success && response.data) {
        setRequestId(response.data.requestId);
        setShowSuccess(true);
      } else {
        setSubmitError(
          response.error?.message || 'Failed to submit your requirements. Please try again.'
        );
      }
    } catch (error) {
      const endTime = performance.now();
      const submissionTime = endTime - startTime;
      console.error(`Form submission failed after ${submissionTime.toFixed(2)}ms:`, error);
      
      setSubmitError('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Success message component
  if (showSuccess && requestId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
        <div className="mx-auto max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Requirements Submitted!
            </h2>
            
            <p className="text-gray-600 mb-6">
              Our AI agents are now working on your personalized itinerary. You'll receive updates as we research, curate, and validate your travel recommendations.
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-500 mb-1">Request ID</p>
              <p className="font-mono text-sm text-gray-900">{requestId}</p>
            </div>
            
            <button
              onClick={() => window.location.href = `/itinerary/${requestId}`}
              className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              View Progress
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Main form render
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Plan Your Perfect Trip
          </h1>
          <p className="text-gray-600">
            Tell us about your travel preferences and let our AI agents create a personalized itinerary just for you.
          </p>
        </div>
        
        {/* Progress bar */}
        <FormProgress
          currentStep={currentStep}
          totalSteps={totalSteps}
          completionPercentage={getCompletionPercentage()}
          onStepClick={handleStepClick}
        />
        
        {/* Form container */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 md:p-8">
            {/* Error display */}
            {submitError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex">
                  <svg className="w-5 h-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium text-red-800">
                      Submission Error
                    </h3>
                    <p className="text-sm text-red-700 mt-1">
                      {submitError}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Step content */}
            <div className="mb-8">
              {currentStep === 0 && <DestinationStep />}
              {currentStep === 1 && <DatesStep />}
              {currentStep === 2 && <PersonaStep />}
              {currentStep === 3 && <PreferencesStep />}
              {currentStep === 4 && <RequestsStep />}
            </div>
            
            {/* Validation errors */}
            {Object.keys(errors).length > 0 && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="text-sm font-medium text-yellow-800 mb-2">
                  Please fix the following errors:
                </h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {Object.entries(errors).map(([field, error]) => (
                    <li key={field} className="flex items-start">
                      <span className="inline-block w-1 h-1 bg-yellow-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          {/* Navigation */}
          <FormNavigation
            currentStep={currentStep}
            totalSteps={totalSteps}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            canGoNext={isStepValid(currentStep)}
          />
        </div>
        
        {/* Value proposition footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>
            Powered by AI • Personalized for you • Ready in minutes
          </p>
        </div>
      </div>
    </div>
  );
}
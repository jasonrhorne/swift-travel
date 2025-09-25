import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RequirementsIntakeForm from '../../../components/forms/RequirementsIntakeForm';
import { useRequirementsStore } from '../../../stores/requirementsStore';

// Mock the store
vi.mock('../../../stores/requirementsStore');

// Mock the API
vi.mock('../../../lib/api/itinerary', () => ({
  submitItineraryRequirements: vi.fn(),
}));

// Mock the step components
vi.mock('../../../components/forms/steps/DestinationStep', () => ({
  default: () => <div data-testid="destination-step">Destination Step</div>,
}));
vi.mock('../../../components/forms/steps/DurationStep', () => ({
  default: () => <div data-testid="duration-step">Duration Step</div>,
}));
vi.mock('../../../components/forms/steps/InterestsStep', () => ({
  default: () => <div data-testid="interests-step">Interests Step</div>,
}));
vi.mock('../../../components/forms/steps/TravelersStep', () => ({
  default: () => <div data-testid="travelers-step">Travelers Step</div>,
}));
vi.mock('../../../components/forms/steps/RequestsStep', () => ({
  default: () => <div data-testid="requests-step">Requests Step</div>,
}));

// Mock the supporting components
vi.mock('../../../components/forms/FormProgress', () => ({
  default: ({ currentStep, onStepClick }: any) => (
    <div data-testid="form-progress">
      Progress: {currentStep}
      <button onClick={() => onStepClick(1)}>Go to step 1</button>
    </div>
  ),
}));

vi.mock('../../../components/forms/FormNavigation', () => ({
  default: ({ onPrevious, onNext, onSubmit, currentStep, totalSteps }: any) => (
    <div data-testid="form-navigation">
      <button onClick={onPrevious} disabled={currentStep === 0}>
        Previous
      </button>
      <button onClick={onNext} disabled={currentStep === totalSteps - 1}>
        Next
      </button>
      {currentStep === totalSteps - 1 && (
        <button onClick={onSubmit}>Submit</button>
      )}
    </div>
  ),
}));

describe('RequirementsIntakeForm', () => {
  const mockStore = {
    // Form state
    currentStep: 0,
    totalSteps: 5,
    isSubmitting: false,
    submitError: null,
    errors: {},
    
    // Form data
    destination: '',
    duration: 'long-weekend',
    interests: [],
    persona: null,
    travelerComposition: null,
    groupSize: 2,
    specialRequests: [],
    accessibilityNeeds: [],
    
    // Actions
    nextStep: vi.fn(),
    previousStep: vi.fn(),
    goToStep: vi.fn(),
    setErrors: vi.fn(),
    clearErrors: vi.fn(),
    setSubmitting: vi.fn(),
    setSubmitError: vi.fn(),
    exportUserRequirements: vi.fn(),
    getCompletionPercentage: vi.fn(() => 0),
    isStepValid: vi.fn(() => true),
  };

  beforeEach(() => {
    vi.mocked(useRequirementsStore).mockReturnValue(mockStore);
    // Reset all mocks
    Object.values(mockStore).forEach(mock => {
      if (typeof mock === 'function' && 'mockClear' in mock) {
        (mock as any).mockClear();
      }
    });
  });

  it('should render the form with correct title', () => {
    render(<RequirementsIntakeForm />);
    
    expect(screen.getByText('Plan Your Perfect Trip')).toBeInTheDocument();
    expect(screen.getByText(/Tell us about your travel preferences/)).toBeInTheDocument();
  });

  it('should render the current step component', () => {
    render(<RequirementsIntakeForm />);
    
    expect(screen.getByTestId('destination-step')).toBeInTheDocument();
    expect(screen.queryByTestId('dates-step')).not.toBeInTheDocument();
  });

  it('should render different step based on currentStep', () => {
    vi.mocked(useRequirementsStore).mockReturnValue({
      ...mockStore,
      currentStep: 1,
    });

    render(<RequirementsIntakeForm />);
    
    expect(screen.getByTestId('dates-step')).toBeInTheDocument();
    expect(screen.queryByTestId('destination-step')).not.toBeInTheDocument();
  });

  it('should display submit error when present', () => {
    vi.mocked(useRequirementsStore).mockReturnValue({
      ...mockStore,
      submitError: 'Test error message',
    });

    render(<RequirementsIntakeForm />);
    
    expect(screen.getByText('Submission Error')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('should display validation errors when present', () => {
    vi.mocked(useRequirementsStore).mockReturnValue({
      ...mockStore,
      errors: {
        destination: 'Destination is required',
        persona: 'Please select a persona',
      },
    });

    render(<RequirementsIntakeForm />);
    
    expect(screen.getByText('Please fix the following errors:')).toBeInTheDocument();
    expect(screen.getByText('Destination is required')).toBeInTheDocument();
    expect(screen.getByText('Please select a persona')).toBeInTheDocument();
  });

  it('should call progress navigation functions', () => {
    render(<RequirementsIntakeForm />);
    
    const progressElement = screen.getByTestId('form-progress');
    const goToStepButton = progressElement.querySelector('button');
    
    fireEvent.click(goToStepButton!);
    
    expect(mockStore.clearErrors).toHaveBeenCalled();
    expect(mockStore.goToStep).toHaveBeenCalledWith(1);
  });

  describe('Form submission', () => {
    it('should handle successful form submission', async () => {
      const { submitItineraryRequirements } = await import('../../../lib/api/itinerary');
      
      vi.mocked(submitItineraryRequirements).mockResolvedValue({
        success: true,
        data: {
          requestId: 'test-request-id',
          itineraryRequest: {} as any,
        },
      });

      vi.mocked(useRequirementsStore).mockReturnValue({
        ...mockStore,
        currentStep: 4, // Last step
        exportUserRequirements: vi.fn(() => ({
          destination: 'Paris, France',
          interests: ['Photography', 'Food'],
          duration: 'long-weekend' as const,
          travelerComposition: { adults: 2, children: 0, childrenAges: [] },
          groupSize: 2,
          specialRequests: [],
          accessibilityNeeds: [],
        })),
      });

      render(<RequirementsIntakeForm />);
      
      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockStore.setSubmitting).toHaveBeenCalledWith(true);
      });

      // Should eventually show success state
      // Note: This would require more complex mocking to test the success state rendering
    });

    it('should handle form submission with validation errors', async () => {
      vi.mocked(useRequirementsStore).mockReturnValue({
        ...mockStore,
        currentStep: 4, // Last step
        exportUserRequirements: vi.fn(() => null), // Invalid data
      });

      render(<RequirementsIntakeForm />);
      
      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);

      expect(mockStore.setSubmitError).toHaveBeenCalledWith(
        'Please complete all required fields before submitting.'
      );
    });

    it('should handle API submission errors', async () => {
      const { submitItineraryRequirements } = await import('../../../lib/api/itinerary');
      
      vi.mocked(submitItineraryRequirements).mockResolvedValue({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid data',
        },
      });

      vi.mocked(useRequirementsStore).mockReturnValue({
        ...mockStore,
        currentStep: 4, // Last step
        exportUserRequirements: vi.fn(() => ({
          destination: 'Paris, France',
          interests: ['Photography', 'Food'],
          duration: 'long-weekend' as const,
          travelerComposition: { adults: 2, children: 0, childrenAges: [] },
          groupSize: 2,
          specialRequests: [],
          accessibilityNeeds: [],
        })),
      });

      render(<RequirementsIntakeForm />);
      
      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockStore.setSubmitError).toHaveBeenCalledWith('Invalid data');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes for error messages', () => {
      vi.mocked(useRequirementsStore).mockReturnValue({
        ...mockStore,
        submitError: 'Test error',
      });

      render(<RequirementsIntakeForm />);
      
      const errorElement = screen.getByText('Test error');
      expect(errorElement).toBeInTheDocument();
      
      // Check that error is properly announced
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      render(<RequirementsIntakeForm />);
      
      // Form should be keyboard accessible
      const form = screen.getByTestId('form-navigation');
      expect(form).toBeInTheDocument();
      
      // Navigation buttons should be focusable
      const nextButton = screen.getByText('Next');
      expect(nextButton).toBeInTheDocument();
      nextButton.focus();
      expect(nextButton).toHaveFocus();
    });
  });

  describe('Responsive design', () => {
    it('should render mobile-friendly layout', () => {
      render(<RequirementsIntakeForm />);
      
      // Check for responsive classes (this is a basic test)
      const container = screen.getByText('Plan Your Perfect Trip').closest('.mx-auto');
      expect(container).toHaveClass('max-w-2xl');
    });
  });

  describe('Value proposition messaging', () => {
    it('should display value proposition footer', () => {
      render(<RequirementsIntakeForm />);
      
      expect(screen.getByText('Powered by AI • Personalized for you • Ready in minutes')).toBeInTheDocument();
    });
  });
});
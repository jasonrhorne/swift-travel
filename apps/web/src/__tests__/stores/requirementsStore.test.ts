import { describe, it, expect, beforeEach } from 'vitest';
import { useRequirementsStore } from '../../stores/requirementsStore';

describe('RequirementsStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useRequirementsStore.getState().reset();
  });

  describe('Initial state', () => {
    it('should have correct default values', () => {
      const state = useRequirementsStore.getState();
      
      expect(state.destination).toBe('');
      expect(state.persona).toBeNull();
      expect(state.groupSize).toBe(2);
      expect(state.specialRequests).toEqual([]);
      expect(state.accessibilityNeeds).toEqual([]);
      expect(state.currentStep).toBe(0);
      expect(state.totalSteps).toBe(5);
      expect(state.isValid).toBe(false);
      expect(state.errors).toEqual({});
      expect(state.isDirty).toBe(false);
      expect(state.isSubmitting).toBe(false);
      expect(state.submitError).toBeNull();
    });
  });

  describe('Data setters', () => {
    it('should set destination correctly', () => {
      const { setDestination } = useRequirementsStore.getState();
      
      setDestination('Paris, France');
      
      const state = useRequirementsStore.getState();
      expect(state.destination).toBe('Paris, France');
      expect(state.isDirty).toBe(true);
      expect(state.lastSaved).toBeInstanceOf(Date);
    });

    it('should set persona correctly', () => {
      const { setPersona } = useRequirementsStore.getState();
      
      setPersona('photography');
      
      const state = useRequirementsStore.getState();
      expect(state.persona).toBe('photography');
      expect(state.isDirty).toBe(true);
    });



    it('should set group size correctly', () => {
      const { setGroupSize } = useRequirementsStore.getState();
      
      setGroupSize(4);
      
      const state = useRequirementsStore.getState();
      expect(state.groupSize).toBe(4);
      expect(state.isDirty).toBe(true);
    });
  });

  describe('Special requests management', () => {
    it('should add special request correctly', () => {
      const { addSpecialRequest } = useRequirementsStore.getState();
      
      addSpecialRequest('Anniversary dinner');
      
      const state = useRequirementsStore.getState();
      expect(state.specialRequests).toEqual(['Anniversary dinner']);
      expect(state.isDirty).toBe(true);
    });

    it('should remove special request correctly', () => {
      const { addSpecialRequest, removeSpecialRequest } = useRequirementsStore.getState();
      
      addSpecialRequest('Request 1');
      addSpecialRequest('Request 2');
      removeSpecialRequest(0);
      
      const state = useRequirementsStore.getState();
      expect(state.specialRequests).toEqual(['Request 2']);
    });

    it('should update special request correctly', () => {
      const { addSpecialRequest, updateSpecialRequest } = useRequirementsStore.getState();
      
      addSpecialRequest('Original request');
      updateSpecialRequest(0, 'Updated request');
      
      const state = useRequirementsStore.getState();
      expect(state.specialRequests).toEqual(['Updated request']);
    });

    it('should limit special requests to 5', () => {
      const { addSpecialRequest } = useRequirementsStore.getState();
      
      for (let i = 0; i < 7; i++) {
        addSpecialRequest(`Request ${i + 1}`);
      }
      
      const state = useRequirementsStore.getState();
      expect(state.specialRequests).toHaveLength(5);
    });

    it('should not add empty special requests', () => {
      const { addSpecialRequest } = useRequirementsStore.getState();
      
      addSpecialRequest('');
      addSpecialRequest('   ');
      
      const state = useRequirementsStore.getState();
      expect(state.specialRequests).toEqual([]);
    });
  });

  describe('Accessibility needs management', () => {
    it('should add accessibility need correctly', () => {
      const { addAccessibilityNeed } = useRequirementsStore.getState();
      
      addAccessibilityNeed('Wheelchair accessible');
      
      const state = useRequirementsStore.getState();
      expect(state.accessibilityNeeds).toEqual(['Wheelchair accessible']);
      expect(state.isDirty).toBe(true);
    });

    it('should remove accessibility need correctly', () => {
      const { addAccessibilityNeed, removeAccessibilityNeed } = useRequirementsStore.getState();
      
      addAccessibilityNeed('Need 1');
      addAccessibilityNeed('Need 2');
      removeAccessibilityNeed(0);
      
      const state = useRequirementsStore.getState();
      expect(state.accessibilityNeeds).toEqual(['Need 2']);
    });

    it('should limit accessibility needs to 10', () => {
      const { addAccessibilityNeed } = useRequirementsStore.getState();
      
      for (let i = 0; i < 12; i++) {
        addAccessibilityNeed(`Need ${i + 1}`);
      }
      
      const state = useRequirementsStore.getState();
      expect(state.accessibilityNeeds).toHaveLength(10);
    });
  });

  describe('Form navigation', () => {
    it('should navigate to next step', () => {
      const { nextStep } = useRequirementsStore.getState();
      
      nextStep();
      
      const state = useRequirementsStore.getState();
      expect(state.currentStep).toBe(1);
    });

    it('should navigate to previous step', () => {
      const { nextStep, previousStep } = useRequirementsStore.getState();
      
      nextStep();
      nextStep();
      previousStep();
      
      const state = useRequirementsStore.getState();
      expect(state.currentStep).toBe(1);
    });

    it('should not go beyond last step', () => {
      const { goToStep, nextStep } = useRequirementsStore.getState();
      
      goToStep(4); // Last step
      nextStep();
      
      const state = useRequirementsStore.getState();
      expect(state.currentStep).toBe(4);
    });

    it('should not go before first step', () => {
      const { previousStep } = useRequirementsStore.getState();
      
      previousStep();
      
      const state = useRequirementsStore.getState();
      expect(state.currentStep).toBe(0);
    });
  });

  describe('Error management', () => {
    it('should set and clear errors', () => {
      const { setErrors, clearErrors } = useRequirementsStore.getState();
      
      setErrors({ destination: 'Required field' });
      
      let state = useRequirementsStore.getState();
      expect(state.errors).toEqual({ destination: 'Required field' });
      expect(state.isValid).toBe(false);
      
      clearErrors();
      
      state = useRequirementsStore.getState();
      expect(state.errors).toEqual({});
      expect(state.isValid).toBe(true);
    });

    it('should set individual field errors', () => {
      const { setFieldError, clearFieldError } = useRequirementsStore.getState();
      
      setFieldError('destination', 'Invalid destination');
      
      let state = useRequirementsStore.getState();
      expect(state.errors.destination).toBe('Invalid destination');
      expect(state.isValid).toBe(false);
      
      clearFieldError('destination');
      
      state = useRequirementsStore.getState();
      expect(state.errors.destination).toBeUndefined();
      expect(state.isValid).toBe(true);
    });
  });

  describe('Utility functions', () => {
    it('should calculate completion percentage correctly', () => {
      const { setDestination, setPersona, setInterests, getCompletionPercentage } = useRequirementsStore.getState();
      
      expect(getCompletionPercentage()).toBe(0);
      
      setDestination('Paris');
      expect(getCompletionPercentage()).toBe(25);
      
      setPersona('photography');
      expect(getCompletionPercentage()).toBe(25);
      
      setInterests(['Food', 'Photography']);
      expect(getCompletionPercentage()).toBe(50);
    });

    it('should validate step completion correctly', () => {
      const { setDestination, isStepValid } = useRequirementsStore.getState();
      
      expect(isStepValid(0)).toBe(false); // Destination step - empty
      
      setDestination('Paris');
      expect(isStepValid(0)).toBe(true); // Destination step - filled
      expect(isStepValid(4)).toBe(true); // Requests step - always valid (optional)
    });

    it('should export user requirements correctly', () => {
      const {
        setDestination,
        setPersona,
        setInterests,
        setTravelerComposition,
        setGroupSize,
        addSpecialRequest,
        addAccessibilityNeed,
        exportUserRequirements
      } = useRequirementsStore.getState();
      
      // Incomplete data
      expect(exportUserRequirements()).toBeNull();
      
      // Complete data
      setDestination('Paris, France');
      setPersona('photography');
      setInterests(['Food', 'Photography']);
      setTravelerComposition({ adults: 2, children: 0, childrenAges: [] });
      setGroupSize(2);
      addSpecialRequest('Anniversary dinner');
      addAccessibilityNeed('Wheelchair accessible');
      
      const result = exportUserRequirements();
      expect(result).toEqual({
        destination: 'Paris, France',
        persona: 'photography',
        interests: ['Food', 'Photography'],
        duration: 'long-weekend',
        travelerComposition: { adults: 2, children: 0, childrenAges: [] },
        groupSize: 2,
        specialRequests: ['Anniversary dinner'],
        accessibilityNeeds: ['Wheelchair accessible']
      });
    });
  });

  describe('Reset functionality', () => {
    it('should reset to initial state', () => {
      const { setDestination, setPersona, addSpecialRequest, reset } = useRequirementsStore.getState();
      
      // Modify state
      setDestination('Paris');
      setPersona('photography');
      addSpecialRequest('Test request');
      
      // Reset
      reset();
      
      const state = useRequirementsStore.getState();
      expect(state.destination).toBe('');
      expect(state.persona).toBeNull();
      expect(state.specialRequests).toEqual([]);
      expect(state.currentStep).toBe(0);
      expect(state.isDirty).toBe(false);
    });
  });
});
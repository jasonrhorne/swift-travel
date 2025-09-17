import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';
import type { UserRequirements, PersonaType, BudgetRange } from '@swift-travel/shared';

// Form state interface
export interface RequirementsFormState {
  // Form data
  destination: string;
  persona: PersonaType | null;
  dates: {
    startDate: Date | null;
    endDate: Date | null;
  };
  budgetRange: BudgetRange | null;
  groupSize: number;
  specialRequests: string[];
  accessibilityNeeds: string[];
  
  // Form metadata
  currentStep: number;
  totalSteps: number;
  isValid: boolean;
  errors: Record<string, string>;
  isDirty: boolean;
  
  // Submission state
  isSubmitting: boolean;
  submitError: string | null;
  lastSaved: Date | null;
}

// Form actions interface
export interface RequirementsFormActions {
  // Data setters
  setDestination: (destination: string) => void;
  setPersona: (persona: PersonaType) => void;
  setDates: (startDate: Date, endDate: Date) => void;
  setBudgetRange: (budget: BudgetRange) => void;
  setGroupSize: (size: number) => void;
  addSpecialRequest: (request: string) => void;
  removeSpecialRequest: (index: number) => void;
  updateSpecialRequest: (index: number, request: string) => void;
  addAccessibilityNeed: (need: string) => void;
  removeAccessibilityNeed: (index: number) => void;
  updateAccessibilityNeed: (index: number, need: string) => void;
  
  // Form navigation
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: number) => void;
  
  // Validation
  setErrors: (errors: Record<string, string>) => void;
  clearErrors: () => void;
  setFieldError: (field: string, error: string) => void;
  clearFieldError: (field: string) => void;
  
  // Form state management
  markDirty: () => void;
  markClean: () => void;
  setSubmitting: (submitting: boolean) => void;
  setSubmitError: (error: string | null) => void;
  
  // Data management
  reset: () => void;
  loadFromLocalStorage: () => void;
  exportUserRequirements: () => UserRequirements | null;
  
  // Utility
  getCompletionPercentage: () => number;
  isStepValid: (step: number) => boolean;
}

// Combined store type
export type RequirementsStore = RequirementsFormState & RequirementsFormActions;

// Default state
const defaultState: RequirementsFormState = {
  destination: '',
  persona: null,
  dates: {
    startDate: null,
    endDate: null,
  },
  budgetRange: null,
  groupSize: 2,
  specialRequests: [],
  accessibilityNeeds: [],
  currentStep: 0,
  totalSteps: 5,
  isValid: false,
  errors: {},
  isDirty: false,
  isSubmitting: false,
  submitError: null,
  lastSaved: null,
};

// Form steps configuration
const FORM_STEPS = [
  'destination',
  'dates', 
  'persona',
  'preferences',
  'requests'
] as const;

export const useRequirementsStore = create<RequirementsStore>()(
  persist(
    immer((set, get) => ({
      ...defaultState,
      
      // Data setters
      setDestination: (destination: string) => set((state) => {
        state.destination = destination;
        state.isDirty = true;
        state.lastSaved = new Date();
      }),
      
      setPersona: (persona: PersonaType) => set((state) => {
        state.persona = persona;
        state.isDirty = true;
        state.lastSaved = new Date();
      }),
      
      setDates: (startDate: Date, endDate: Date) => set((state) => {
        state.dates.startDate = startDate;
        state.dates.endDate = endDate;
        state.isDirty = true;
        state.lastSaved = new Date();
      }),
      
      setBudgetRange: (budget: BudgetRange) => set((state) => {
        state.budgetRange = budget;
        state.isDirty = true;
        state.lastSaved = new Date();
      }),
      
      setGroupSize: (size: number) => set((state) => {
        state.groupSize = size;
        state.isDirty = true;
        state.lastSaved = new Date();
      }),
      
      addSpecialRequest: (request: string) => set((state) => {
        if (state.specialRequests.length < 5 && request.trim()) {
          state.specialRequests.push(request.trim());
          state.isDirty = true;
          state.lastSaved = new Date();
        }
      }),
      
      removeSpecialRequest: (index: number) => set((state) => {
        if (index >= 0 && index < state.specialRequests.length) {
          state.specialRequests.splice(index, 1);
          state.isDirty = true;
          state.lastSaved = new Date();
        }
      }),
      
      updateSpecialRequest: (index: number, request: string) => set((state) => {
        if (index >= 0 && index < state.specialRequests.length) {
          state.specialRequests[index] = request.trim();
          state.isDirty = true;
          state.lastSaved = new Date();
        }
      }),
      
      addAccessibilityNeed: (need: string) => set((state) => {
        if (state.accessibilityNeeds.length < 10 && need.trim()) {
          state.accessibilityNeeds.push(need.trim());
          state.isDirty = true;
          state.lastSaved = new Date();
        }
      }),
      
      removeAccessibilityNeed: (index: number) => set((state) => {
        if (index >= 0 && index < state.accessibilityNeeds.length) {
          state.accessibilityNeeds.splice(index, 1);
          state.isDirty = true;
          state.lastSaved = new Date();
        }
      }),
      
      updateAccessibilityNeed: (index: number, need: string) => set((state) => {
        if (index >= 0 && index < state.accessibilityNeeds.length) {
          state.accessibilityNeeds[index] = need.trim();
          state.isDirty = true;
          state.lastSaved = new Date();
        }
      }),
      
      // Form navigation
      nextStep: () => set((state) => {
        if (state.currentStep < state.totalSteps - 1) {
          state.currentStep++;
        }
      }),
      
      previousStep: () => set((state) => {
        if (state.currentStep > 0) {
          state.currentStep--;
        }
      }),
      
      goToStep: (step: number) => set((state) => {
        if (step >= 0 && step < state.totalSteps) {
          state.currentStep = step;
        }
      }),
      
      // Validation
      setErrors: (errors: Record<string, string>) => set((state) => {
        state.errors = errors;
        state.isValid = Object.keys(errors).length === 0;
      }),
      
      clearErrors: () => set((state) => {
        state.errors = {};
        state.isValid = true;
      }),
      
      setFieldError: (field: string, error: string) => set((state) => {
        state.errors[field] = error;
        state.isValid = false;
      }),
      
      clearFieldError: (field: string) => set((state) => {
        delete state.errors[field];
        state.isValid = Object.keys(state.errors).length === 0;
      }),
      
      // Form state management
      markDirty: () => set((state) => {
        state.isDirty = true;
      }),
      
      markClean: () => set((state) => {
        state.isDirty = false;
      }),
      
      setSubmitting: (submitting: boolean) => set((state) => {
        state.isSubmitting = submitting;
      }),
      
      setSubmitError: (error: string | null) => set((state) => {
        state.submitError = error;
      }),
      
      // Data management
      reset: () => set((state) => {
        Object.assign(state, defaultState);
      }),
      
      loadFromLocalStorage: () => {
        // This is handled by the persist middleware automatically
      },
      
      exportUserRequirements: (): UserRequirements | null => {
        const state = get();
        
        if (!state.destination || !state.persona || !state.dates.startDate || 
            !state.dates.endDate || !state.budgetRange) {
          return null;
        }
        
        return {
          destination: state.destination,
          persona: state.persona,
          dates: {
            startDate: state.dates.startDate,
            endDate: state.dates.endDate,
          },
          budgetRange: state.budgetRange,
          groupSize: state.groupSize,
          specialRequests: state.specialRequests,
          accessibilityNeeds: state.accessibilityNeeds,
        };
      },
      
      // Utility
      getCompletionPercentage: (): number => {
        const state = get();
        let completed = 0;
        
        if (state.destination) completed++;
        if (state.dates.startDate && state.dates.endDate) completed++;
        if (state.persona) completed++;
        if (state.budgetRange) completed++;
        // Special requests and accessibility are optional
        
        return Math.round((completed / 4) * 100);
      },
      
      isStepValid: (step: number): boolean => {
        const state = get();
        
        switch (step) {
          case 0: // destination
            return state.destination.length >= 2;
          case 1: // dates
            return state.dates.startDate !== null && state.dates.endDate !== null;
          case 2: // persona
            return state.persona !== null;
          case 3: // preferences
            return state.budgetRange !== null;
          case 4: // requests
            return true; // Optional step
          default:
            return false;
        }
      },
    })),
    {
      name: 'swift-travel-requirements',
      // Only persist form data, not UI state
      partialize: (state) => ({
        destination: state.destination,
        persona: state.persona,
        dates: state.dates,
        budgetRange: state.budgetRange,
        groupSize: state.groupSize,
        specialRequests: state.specialRequests,
        accessibilityNeeds: state.accessibilityNeeds,
        lastSaved: state.lastSaved,
      }),
    }
  )
);
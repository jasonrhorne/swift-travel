import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';
import type { UserRequirements, PersonaType } from '@swift-travel/shared';

export interface TravelerComposition {
  adults: number;
  children: number;
  childrenAges: number[];
}

// Form state interface
export interface RequirementsFormState {
  // Form data
  destination: string;
  interests: string[]; // Selected travel interests
  persona: PersonaType | null; // Legacy field, kept for compatibility
  duration: 'long-weekend'; // Fixed duration for long weekend trips
  dates: {
    startDate: Date | null;
    endDate: Date | null;
  };
  travelerComposition: TravelerComposition | null;
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
  setInterests: (interests: string[]) => void;
  setPersona: (persona: PersonaType) => void;
  setDuration: (duration: 'long-weekend') => void;
  setDates: (startDate: Date, endDate: Date) => void;
  setTravelerComposition: (composition: TravelerComposition) => void;
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
  interests: [],
  persona: null,
  duration: 'long-weekend',
  dates: {
    startDate: null,
    endDate: null,
  },
  travelerComposition: null,
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
// const FORM_STEPS = [
//   'destination',
//   'duration', 
//   'interests',
//   'travelers',
//   'requests'
// ] as const;

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
      
      setInterests: (interests: string[]) => set((state) => {
        state.interests = interests;
        state.isDirty = true;
        state.lastSaved = new Date();
      }),
      
      setPersona: (persona: PersonaType) => set((state) => {
        state.persona = persona;
        state.isDirty = true;
        state.lastSaved = new Date();
      }),
      
      setDuration: (duration: 'long-weekend') => set((state) => {
        state.duration = duration;
        state.isDirty = true;
        state.lastSaved = new Date();
      }),
      
      setDates: (startDate: Date, endDate: Date) => set((state) => {
        state.dates.startDate = startDate;
        state.dates.endDate = endDate;
        state.isDirty = true;
        state.lastSaved = new Date();
      }),
      
      setTravelerComposition: (composition: TravelerComposition) => set((state) => {
        state.travelerComposition = composition;
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
        
        if (!state.destination || state.interests.length === 0 || !state.duration || !state.travelerComposition) {
          return null;
        }
        
        return {
          destination: state.destination,
          interests: state.interests,
          persona: state.persona || 'photography', // Default persona for backward compatibility
          duration: state.duration,
          budgetRange: 'mid-range', // Default budget for backward compatibility
          groupSize: state.groupSize,
          travelerComposition: state.travelerComposition,
          specialRequests: state.specialRequests,
          accessibilityNeeds: state.accessibilityNeeds,
        } as UserRequirements; // Temporarily cast to UserRequirements until type is updated
      },
      
      // Utility
      getCompletionPercentage: (): number => {
        const state = get();
        let completed = 0;
        
        if (state.destination) completed++;
        if (state.duration) completed++;
        if (state.interests.length > 0) completed++;
        if (state.travelerComposition) completed++;
        // Special requests and accessibility are optional
        
        return Math.round((completed / 4) * 100);
      },
      
      isStepValid: (step: number): boolean => {
        const state = get();
        
        switch (step) {
          case 0: // destination
            return state.destination.length >= 2;
          case 1: // duration
            return state.duration === 'long-weekend';
          case 2: // interests
            return state.interests.length > 0;
          case 3: // travelers
            return state.travelerComposition !== null && state.groupSize >= 1;
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
        interests: state.interests,
        persona: state.persona,
        duration: state.duration,
        dates: state.dates,
        travelerComposition: state.travelerComposition,
        groupSize: state.groupSize,
        specialRequests: state.specialRequests,
        accessibilityNeeds: state.accessibilityNeeds,
        lastSaved: state.lastSaved,
      }),
    }
  )
);
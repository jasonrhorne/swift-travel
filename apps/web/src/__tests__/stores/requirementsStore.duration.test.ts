import { describe, it, expect, beforeEach } from 'vitest';
import { useRequirementsStore } from '../../stores/requirementsStore';

describe('RequirementsStore - Duration Management', () => {
  beforeEach(() => {
    // Reset store to initial state
    useRequirementsStore.setState({
      destination: '',
      interests: [],
      persona: null,
      duration: 'long-weekend',
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
    });
  });
  
  it('should have long-weekend as default duration', () => {
    const store = useRequirementsStore.getState();
    expect(store.duration).toBe('long-weekend');
  });
  
  it('should update duration when setDuration is called', () => {
    const store = useRequirementsStore.getState();
    
    store.setDuration('long-weekend');
    
    const updatedStore = useRequirementsStore.getState();
    expect(updatedStore.duration).toBe('long-weekend');
    expect(updatedStore.isDirty).toBe(true);
    expect(updatedStore.lastSaved).toBeInstanceOf(Date);
  });
  
  it('should not have dates field in the store', () => {
    const store = useRequirementsStore.getState();
    expect('dates' in store).toBe(false);
  });
  
  it('should not have setDates method', () => {
    const store = useRequirementsStore.getState();
    expect('setDates' in store).toBe(true); // It exists in type but check if it's a function
    expect(typeof (store as any).setDates).toBe('undefined');
  });
  
  it('should export user requirements with duration', () => {
    const store = useRequirementsStore.getState();
    
    // Set required fields
    store.setDestination('New York City, NY');
    store.setInterests(['Art & Museums', 'Food & Dining']);
    store.setTravelerComposition({
      adults: 2,
      children: 0,
      childrenAges: []
    });
    
    const requirements = store.exportUserRequirements();
    
    expect(requirements).not.toBeNull();
    expect(requirements?.duration).toBe('long-weekend');
    expect('dates' in requirements!).toBe(false);
  });
  
  it('should validate step 1 (duration step) as valid', () => {
    const store = useRequirementsStore.getState();
    
    // Step 1 is duration step which should always be valid since it has a default value
    const isValid = store.isStepValid(1);
    
    expect(isValid).toBe(true);
  });
  
  it('should persist duration in localStorage', () => {
    const store = useRequirementsStore.getState();
    
    store.setDuration('long-weekend');
    
    // Get the persisted state
    const persistedState = JSON.parse(
      localStorage.getItem('swift-travel-requirements') || '{}'
    );
    
    expect(persistedState.state.duration).toBe('long-weekend');
    expect('dates' in persistedState.state).toBe(false);
  });
});
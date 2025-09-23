# Story RF-1.5: Add Traveler Composition Collection

## User Story
**As a** family traveler  
**I want** to specify the number and ages of children  
**So that** I receive age-appropriate activity recommendations

## Acceptance Criteria
- [ ] Add adult count selector (1-10 range)
- [ ] Add children count selector (0-8 range)
- [ ] Dynamically show age inputs for each child
- [ ] Validate ages are between 0-17

## Technical Details

### Files to Create/Modify
- `/apps/web/src/components/forms/steps/TravelerCompositionStep.tsx` (NEW)
- `/apps/web/src/stores/requirementsStore.ts`
- `/packages/shared/src/types/requirements.ts`
- `/apps/web/src/components/forms/RequirementsIntakeForm.tsx`
- `/packages/shared/src/schemas/requirements.ts`

### Implementation Steps
1. Create new TravelerCompositionStep component
2. Add number selectors for adults and children
3. Implement dynamic age input fields based on children count
4. Add to form step sequence in RequirementsIntakeForm
5. Update store to handle traveler composition data
6. Add validation for age ranges

### UI Design
- Adult selector: Dropdown or number input
- Children selector: Dropdown or number input  
- Age inputs: Appear dynamically below when children > 0
- Layout: Responsive grid for age inputs

## Integration Verification
- [ ] IV1: Dynamic form fields render without performance issues
- [ ] IV2: State management handles variable-length arrays properly
- [ ] IV3: Form validation works with dynamic field count

## Dependencies
- Should be implemented after Stories RF-1.1 through RF-1.4

## Estimated Effort
- 5 hours

## Testing Requirements
- Unit tests for dynamic field generation
- State management tests for arrays
- Validation tests for age ranges
- Performance tests for multiple child inputs
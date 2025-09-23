# Story 1.4: Remove Budget Collection

## User Story
**As a** user  
**I want** to skip budget questions  
**So that** I can get recommendations without sharing financial information

## Acceptance Criteria
- [ ] Remove all budget-related fields from PreferencesStep
- [ ] Update validation to not require budget data
- [ ] Clean up unused budget state from Zustand store
- [ ] Modify API to handle requests without budget parameters

## Technical Details

### Files to Modify
- `/apps/web/src/components/forms/steps/PreferencesStep.tsx`
- `/apps/web/src/stores/requirementsStore.ts`
- `/packages/shared/src/types/requirements.ts`
- `/packages/shared/src/schemas/requirements.ts`
- `/apps/web/src/lib/api/itinerary.ts`

### Implementation Steps
1. Remove budget UI components from PreferencesStep
2. Delete budget-related state from requirementsStore
3. Update TypeScript interfaces to make budget optional/remove
4. Modify validation schemas to not require budget
5. Clean up any budget-related utility functions
6. Update API payload to exclude budget

## Integration Verification
- [ ] IV1: Form submission works without budget data
- [ ] IV2: AI generation adapts to missing budget constraints
- [ ] IV3: No orphaned budget references cause errors

## Dependencies
- Can be done after Story 1.3

## Estimated Effort
- 2 hours

## Testing Requirements
- Unit tests for form submission without budget
- Integration tests for API calls
- Regression tests to ensure no budget references remain
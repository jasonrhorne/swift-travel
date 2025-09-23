# Story 1.2: Replace Date Selection with Long Weekend Duration

## User Story
**As a** traveler  
**I want** to see long weekend itinerary templates  
**So that** I can get inspiration without committing to specific dates

## Acceptance Criteria
- [ ] Remove date picker components from DatesStep
- [ ] Add "Long Weekend (3-4 days)" as default duration
- [ ] Update state management to handle date-agnostic itineraries
- [ ] Modify API to process duration instead of specific dates

## Technical Details

### Files to Modify
- `/apps/web/src/components/forms/steps/DatesStep.tsx`
- `/apps/web/src/stores/requirementsStore.ts`
- `/packages/shared/src/types/itinerary.ts`
- `/packages/shared/src/schemas/requirements.ts`
- `/apps/web/src/lib/api/itinerary.ts`

### Implementation Steps
1. Remove react-datepicker dependency if used
2. Create new DurationSelector component
3. Update DatesStep to show only duration option
4. Modify requirementsStore to store duration instead of dates
5. Update TypeScript interfaces to reflect new structure
6. Adjust API payload structure

## Integration Verification
- [ ] IV1: Form navigation continues to work without date validation
- [ ] IV2: Zustand store properly handles new data structure
- [ ] IV3: API endpoints accept modified payload without errors

## Dependencies
- Should be completed after Story 1.1

## Estimated Effort
- 3 hours

## Testing Requirements
- Unit tests for duration selection
- State management tests for new data structure
- API integration tests with duration field
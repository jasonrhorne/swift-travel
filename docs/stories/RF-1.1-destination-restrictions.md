# Story 1.1: Restrict Destinations to US/Canada

## User Story
**As a** product owner  
**I want** to limit destination selection to US and Canada locations only  
**So that** we can provide higher quality, focused content for our target market

## Acceptance Criteria
- [ ] Destination input accepts only US and Canada cities/regions
- [ ] Popular destinations show only US/Canada options
- [ ] Validation prevents non-US/Canada entries  
- [ ] Existing global destinations in database remain readable but not selectable

## Technical Details

### Files to Modify
- `/apps/web/src/components/forms/steps/DestinationStep.tsx`
- `/apps/web/src/stores/requirementsStore.ts`
- `/packages/shared/src/schemas/requirements.ts`
- `/apps/web/src/lib/api/itinerary.ts`

### Implementation Steps
1. Update destination validation schema in shared package
2. Create US/Canada city list constant
3. Modify DestinationStep component to filter suggestions
4. Update popular destinations list
5. Add validation to prevent non-US/Canada entries
6. Update tests for new validation rules

## Integration Verification
- [ ] IV1: Existing destination search functionality continues to work with filtered dataset
- [ ] IV2: Form validation still triggers appropriately with new constraints
- [ ] IV3: Page load time remains within 10% of current performance

## Dependencies
- None (can be implemented first)

## Estimated Effort
- 4 hours

## Testing Requirements
- Unit tests for destination validation
- Component tests for DestinationStep
- E2E test for form submission with US/Canada destinations
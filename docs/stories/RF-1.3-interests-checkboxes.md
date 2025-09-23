# Story 1.3: Transform Personas to Interest Checkboxes

## User Story
**As a** user  
**I want** to select multiple interests that match my travel style  
**So that** I get more personalized recommendations

## Acceptance Criteria
- [ ] Replace PersonaStep with new InterestsStep component
- [ ] Implement checkbox UI with all 12 interest categories
- [ ] Allow multiple selections with no minimum/maximum
- [ ] Update form validation to handle array of interests

## Interest Categories
1. Arts and Culture
2. Food and Dining
3. History and Heritage
4. Outdoor Activities
5. Adventure and Sports
6. Music and Entertainment
7. Shopping
8. Family Fun
9. Wellness and Relaxation
10. Learning and Education
11. Photography and Sightseeing
12. Local Life and Community

## Technical Details

### Files to Modify
- `/apps/web/src/components/forms/steps/PersonaStep.tsx` → rename to `InterestsStep.tsx`
- `/apps/web/src/stores/requirementsStore.ts`
- `/packages/shared/src/types/requirements.ts`
- `/apps/web/src/components/forms/RequirementsIntakeForm.tsx`

### Implementation Steps
1. Create InterestsStep component with checkbox layout
2. Design responsive grid for 12 checkboxes
3. Update store to handle interests array instead of persona string
4. Modify form navigation to use new step
5. Update TypeScript types for interests
6. Add proper ARIA labels for accessibility

## Integration Verification
- [ ] IV1: Form progression logic works with new step
- [ ] IV2: State persistence maintains selections across navigation
- [ ] IV3: Styling remains consistent with existing Tailwind design system

## Dependencies
- Can be done in parallel with Stories 1.1 and 1.2

## Estimated Effort
- 4 hours

## Testing Requirements
- Unit tests for checkbox selection logic
- Component tests for InterestsStep
- Accessibility tests for checkbox interactions
- State persistence tests
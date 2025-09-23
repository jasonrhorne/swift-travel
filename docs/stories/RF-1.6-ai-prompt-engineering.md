# Story RF-1.6: Update AI Prompt Engineering

## User Story
**As a** system  
**I want** to process new requirement structures  
**So that** I generate appropriate long weekend itineraries

## Acceptance Criteria
- [ ] Modify AI agent prompts for interest-based personalization
- [ ] Update prompts for US/Canada destination focus
- [ ] Implement family-friendly filtering based on children ages
- [ ] Adjust for long weekend duration templates

## Technical Details

### Files to Modify
- `/apps/functions/src/agents/*.ts` (all agent files)
- `/apps/functions/src/prompts/*.ts` (prompt templates)
- `/packages/shared/src/types/agents.ts`
- `/apps/web/src/lib/api/itinerary.ts`

### Implementation Steps
1. Update research agent prompts for US/Canada focus
2. Modify planning agent to use interests instead of personas
3. Add child-friendly activity filtering logic
4. Update duration handling for long weekend templates
5. Adjust budget-related prompt sections (remove)
6. Test prompt effectiveness with new data structure

### Prompt Engineering Changes
- Remove global destination handling
- Replace persona matching with interest-based scoring
- Add age-appropriate filtering rules:
  - 0-2 years: Baby-friendly venues
  - 3-5 years: Toddler activities  
  - 6-11 years: Kid-friendly attractions
  - 12-17 years: Teen-appropriate activities
- Focus on 3-4 day itinerary structure

## Integration Verification
- [ ] IV1: Existing AI pipeline continues to function
- [ ] IV2: Response format remains compatible with display components
- [ ] IV3: Generation time stays within acceptable limits

## Dependencies
- Must be completed AFTER all other stories (RF-1.1 through RF-1.5)

## Estimated Effort
- 6 hours

## Testing Requirements
- Prompt effectiveness testing with various interest combinations
- Family-friendly filtering validation
- Performance benchmarks for generation time
- Output format compatibility tests
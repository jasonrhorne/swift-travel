# Swift Travel Brownfield Enhancement PRD

## Intro Project Analysis and Context

### Existing Project Overview

**Analysis Source**: IDE-based fresh analysis

**Current Project State**: Swift Travel is an AI-powered travel itinerary generator that currently:
- Provides a multi-step form for collecting user travel preferences
- Supports global destination selection  
- Uses prescribed personas for user categorization
- Collects specific travel dates
- Includes budget range selection
- Generates personalized itineraries using a multi-agent AI system

### Available Documentation Analysis

**Available Documentation**:
- ✓ Tech Stack Documentation (package.json files)
- ✓ Source Tree/Architecture (visible in IDE)
- ✓ API Documentation (lib/api structure)
- ✓ External API Documentation (Netlify, Supabase configs)
- ✓ Technical Debt Documentation (recent fixes tracked in git)
- ⚠️ UX/UI Guidelines (partial - component structure visible)
- ✓ Coding Standards (TypeScript, Next.js patterns)

### Enhancement Scope Definition

**Enhancement Type**: 
- ✓ Major Feature Modification
- ✓ UI/UX Overhaul

**Enhancement Description**: Refocusing the application to serve US/Canada long weekend travel planning with a more flexible interest-based personalization system and improved group travel support, removing date-specific and budget collection features.

**Impact Assessment**:
- ✓ Significant Impact (substantial existing code changes)

### Goals and Background Context

**Goals**:
- Simplify itinerary generation to focus on reusable long weekend templates
- Improve personalization through granular interest selection
- Better support family travel planning with child age considerations
- Reduce friction by removing budget questions
- Focus market approach on US/Canada destinations

**Background Context**: 
Based on user testing and market analysis, the application needs to pivot from a global, date-specific travel planner to a more focused long weekend itinerary generator for North American destinations. This change will allow for more reusable content, better family travel support, and reduced user friction during the intake process.

### Change Log
| Change | Date | Version | Description | Author |
|--------|------|---------|-------------|--------|
| Initial Draft | 2024-01-19 | 1.0 | Brownfield PRD for Swift Travel adjustments | John (PM) |

## Requirements

### Functional Requirements

- **FR1**: The system shall restrict destination selection to cities and regions within the United States and Canada only, replacing the current global destination support.
- **FR2**: The system shall provide general long weekend itinerary templates (3-4 days) that are date-agnostic, removing the current specific date selection functionality.
- **FR3**: The system shall replace the prescribed persona system with a multi-select interest checkbox interface offering: Arts and Culture, Food and Dining, History and Heritage, Outdoor Activities, Adventure and Sports, Music and Entertainment, Shopping, Family Fun, Wellness and Relaxation, Learning and Education, Photography and Sightseeing, and Local Life and Community.
- **FR4**: The system shall remove all budget-related questions and fields from the requirements intake form.
- **FR5**: The system shall collect the number of adult travelers in the group.
- **FR6**: The system shall collect the number of child travelers and their individual ages for family-appropriate activity recommendations.
- **FR7**: The system shall maintain the existing multi-step form navigation while adapting to the new field requirements.
- **FR8**: The AI itinerary generation shall process the new interest-based selections to create personalized recommendations.

### Non-Functional Requirements

- **NFR1**: The enhancement must maintain the existing Next.js/React architecture and not introduce breaking changes to the core application structure.
- **NFR2**: The modified form must maintain the current responsive design and work across desktop and mobile devices.
- **NFR3**: The system shall maintain the existing Zustand state management patterns for form data persistence.
- **NFR4**: Page load performance must not degrade by more than 10% after implementing the changes.
- **NFR5**: The system shall maintain the existing TypeScript type safety throughout all modifications.

### Compatibility Requirements

- **CR1**: The existing API structure for itinerary generation must remain compatible, with new fields mapped appropriately to the AI agents.
- **CR2**: The database schema changes must be backward compatible or include migration scripts for existing user data.
- **CR3**: The UI modifications must maintain consistency with the existing Tailwind CSS design system and component patterns.
- **CR4**: The Netlify Functions integration must continue to work with the modified data structure for API calls.

## Technical Constraints and Integration Requirements

### Existing Technology Stack
**Languages**: TypeScript, JavaScript
**Frameworks**: Next.js 14.2.32, React 18.2.0, Tailwind CSS 3.4.0
**Database**: Supabase (PostgreSQL)
**Infrastructure**: Netlify (hosting & functions), Vercel (Next.js optimization)
**External Dependencies**: Zustand (state management), Headless UI, Sentry (monitoring)

### Integration Approach
**Database Integration Strategy**: Modify existing Supabase tables to add traveler composition fields (adults_count, children_ages array), remove budget fields, update destination constraints to US/Canada only. Use Supabase migrations for schema changes.

**API Integration Strategy**: Update the submitItineraryRequirements API endpoint to handle the new data structure. Modify the AI agent prompts to work with interest selections instead of personas and generate date-agnostic long weekend itineraries.

**Frontend Integration Strategy**: Refactor existing form steps (DestinationStep, DatesStep, PersonaStep, PreferencesStep) to support new requirements. PersonaStep becomes InterestsStep with checkbox UI, DatesStep becomes simplified duration selector.

**Testing Integration Strategy**: Update existing Vitest test suites to reflect new form validation rules, add new test cases for traveler composition logic, modify E2E tests to work with new flow.

### Code Organization and Standards
**File Structure Approach**: Maintain existing /src/components/forms/steps structure, rename PersonaStep to InterestsStep, add new TravelerCompositionStep component.

**Naming Conventions**: Follow existing camelCase for variables, PascalCase for components, maintain TypeScript interfaces with "I" prefix where established.

**Coding Standards**: Maintain existing TypeScript strict mode, use existing Zustand patterns for state updates, follow established React hooks patterns.

**Documentation Standards**: Update inline JSDoc comments, maintain existing README structure, add migration notes to docs folder.

### Deployment and Operations
**Build Process Integration**: No changes needed to existing npm scripts or build configuration, Tailwind will automatically pick up new utility classes.

**Deployment Strategy**: Use Netlify's preview deployments for testing, implement feature flag for gradual rollout if needed, maintain zero-downtime deployment.

**Monitoring and Logging**: Maintain existing Sentry error tracking, add new events for interest selection patterns, track family composition metrics.

**Configuration Management**: Update environment variables for any new feature flags, maintain existing .env structure, no new external service configurations needed.

### Risk Assessment and Mitigation
**Technical Risks**: Form validation complexity with dynamic children age fields, potential state management issues with array of ages, CSS conflicts with new checkbox layouts.

**Integration Risks**: AI agents might need prompt engineering to work effectively with multiple interests vs single persona, existing itineraries in database won't have new fields.

**Deployment Risks**: Users mid-session during deployment might experience form errors, cached versions might conflict with new validation rules.

**Mitigation Strategies**: Implement progressive form validation, add defensive checks for undefined fields, use feature flags for gradual rollout, provide data migration scripts for existing records, implement session versioning.

## Epic and Story Structure

### Epic Approach

**Epic Structure Decision**: Single comprehensive epic for Swift Travel requirements refactoring. 

All changes are interconnected modifications to the existing requirements intake flow. Breaking this into multiple epics would create unnecessary dependencies and coordination overhead. A single epic ensures cohesive implementation of the new personalization model while maintaining system integrity.

## Epic 1: Refactor Swift Travel Requirements Collection for US/Canada Long Weekend Focus

**Epic Goal**: Transform the existing global date-specific travel planner into a focused US/Canada long weekend itinerary generator with interest-based personalization and enhanced family travel support.

**Integration Requirements**: All modifications must maintain backward compatibility with existing itinerary generation pipeline, preserve current user sessions, and support gradual migration of existing data.

### Story 1.1: Restrict Destinations to US/Canada

As a product owner,
I want to limit destination selection to US and Canada locations only,
so that we can provide higher quality, focused content for our target market.

**Acceptance Criteria**:
1. Destination input accepts only US and Canada cities/regions
2. Popular destinations show only US/Canada options
3. Validation prevents non-US/Canada entries
4. Existing global destinations in database remain readable but not selectable

**Integration Verification**:
- IV1: Existing destination search functionality continues to work with filtered dataset
- IV2: Form validation still triggers appropriately with new constraints
- IV3: Page load time remains within 10% of current performance

### Story 1.2: Replace Date Selection with Long Weekend Duration

As a traveler,
I want to see long weekend itinerary templates,
so that I can get inspiration without committing to specific dates.

**Acceptance Criteria**:
1. Remove date picker components from DatesStep
2. Add "Long Weekend (3-4 days)" as default duration
3. Update state management to handle date-agnostic itineraries
4. Modify API to process duration instead of specific dates

**Integration Verification**:
- IV1: Form navigation continues to work without date validation
- IV2: Zustand store properly handles new data structure
- IV3: API endpoints accept modified payload without errors

### Story 1.3: Transform Personas to Interest Checkboxes

As a user,
I want to select multiple interests that match my travel style,
so that I get more personalized recommendations.

**Acceptance Criteria**:
1. Replace PersonaStep with new InterestsStep component
2. Implement checkbox UI with all 12 interest categories
3. Allow multiple selections with no minimum/maximum
4. Update form validation to handle array of interests

**Integration Verification**:
- IV1: Form progression logic works with new step
- IV2: State persistence maintains selections across navigation
- IV3: Styling remains consistent with existing Tailwind design system

### Story 1.4: Remove Budget Collection

As a user,
I want to skip budget questions,
so that I can get recommendations without sharing financial information.

**Acceptance Criteria**:
1. Remove all budget-related fields from PreferencesStep
2. Update validation to not require budget data
3. Clean up unused budget state from Zustand store
4. Modify API to handle requests without budget parameters

**Integration Verification**:
- IV1: Form submission works without budget data
- IV2: AI generation adapts to missing budget constraints
- IV3: No orphaned budget references cause errors

### Story 1.5: Add Traveler Composition Collection

As a family traveler,
I want to specify the number and ages of children,
so that I receive age-appropriate activity recommendations.

**Acceptance Criteria**:
1. Add adult count selector (1-10 range)
2. Add children count selector (0-8 range)
3. Dynamically show age inputs for each child
4. Validate ages are between 0-17

**Integration Verification**:
- IV1: Dynamic form fields render without performance issues
- IV2: State management handles variable-length arrays properly
- IV3: Form validation works with dynamic field count

### Story 1.6: Update AI Prompt Engineering

As a system,
I want to process new requirement structures,
so that I generate appropriate long weekend itineraries.

**Acceptance Criteria**:
1. Modify AI agent prompts for interest-based personalization
2. Update prompts for US/Canada destination focus
3. Implement family-friendly filtering based on children ages
4. Adjust for long weekend duration templates

**Integration Verification**:
- IV1: Existing AI pipeline continues to function
- IV2: Response format remains compatible with display components
- IV3: Generation time stays within acceptable limits

## Implementation Notes

This story sequence minimizes risk by:
1. Starting with simple constraints (destinations) before complex changes
2. Removing features (dates, budget) before adding new ones (interests, travelers)
3. Saving AI modifications for last when all data changes are stable
4. Each story can be tested independently while maintaining system function

## Success Metrics

- User completion rate of requirements form increases by 20%
- Average time to complete form decreases by 30%
- Family traveler segment engagement increases by 40%
- Itinerary relevance score improves by 25% based on user feedback
- System maintains 99.9% uptime during migration
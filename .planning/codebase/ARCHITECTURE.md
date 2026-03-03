# Architecture

**Analysis Date:** 2026-03-03

## Pattern Overview

**Overall:** Multi-agent orchestration architecture with clear separation between frontend UI, serverless backend functions, and shared package utilities.

**Key Characteristics:**

- Monorepo structure with workspace-managed dependencies (npm workspaces)
- Serverless functions deployed on Netlify as API backend
- Real-time processing via multi-agent pipeline orchestrated through Redis state management
- Type-safe shared contracts via TypeScript interfaces in `@swift-travel/shared` package
- Event-driven communication between agents and frontend via Server-Sent Events (SSE)

## Layers

**Presentation Layer (Frontend):**

- Purpose: User interface for travel itinerary generation through multi-step form workflow
- Location: `apps/web/src`
- Contains: Next.js pages, React components, Zustand stores, API client layer
- Depends on: `@swift-travel/shared` for types and validation schemas
- Used by: End users accessing the web application

**API/Functions Layer:**

- Purpose: Serverless Netlify Functions that handle requests and orchestrate agent processing
- Location: `apps/functions/src` and `netlify-functions/` (compiled output)
- Contains: Auth handlers, itinerary processors, and agent entry points
- Depends on: `@swift-travel/shared`, `@swift-travel/database`, `@swift-travel/agents`
- Used by: Frontend making HTTP requests, agent systems triggering other agents

**Agent Layer:**

- Purpose: Multi-agent system for itinerary generation (Research → Curation → Validation → Response)
- Location: `packages/agents/src`
- Contains: Individual agent implementations (`research/`, `curation/`, `validation/`, `response/`)
- Depends on: `@swift-travel/shared`, `@swift-travel/database`, Redis, OpenAI
- Used by: Orchestration system in `process-request.ts`

**Database Layer:**

- Purpose: Data persistence and schema management
- Location: `packages/database/src`
- Contains: Supabase client configuration, migrations, type definitions, schemas
- Depends on: `@supabase/supabase-js`
- Used by: All other layers for data persistence

**Shared/Utilities Layer:**

- Purpose: Common types, configurations, constants, and utility functions
- Location: `packages/shared/src`
- Contains: Type definitions, configuration management, constants, validation schemas
- Depends on: Zod (validation), Pino (logging), Sentry (error tracking)
- Used by: All other packages and applications

## Data Flow

**User Itinerary Request Flow:**

1. **Frontend Form Submission**
   - User fills multi-step form in `apps/web/src/app/requirements/page.tsx`
   - Form state managed by `useRequirementsStore` (Zustand + immer + persist)
   - User submits via `submitItineraryRequirements()` from `apps/web/src/lib/api/itinerary.ts`

2. **Backend Reception**
   - POST to `/.netlify/functions/itineraries-process-request`
   - Handler: `apps/functions/src/itineraries/process-request.ts`
   - Validates `UserRequirements` type from shared package
   - Saves request state to Redis with key `itinerary_request:{requestId}`

3. **Agent Orchestration**
   - Process request handler initializes processing state in Redis
   - Triggers research agent via HTTP POST to `/.netlify/functions/agents-research`
   - Each agent completes processing and calls `completeAgentProcessing()` to update Redis
   - Agent chain: Research → Curation → Validation → Response
   - Each transition updates `ItineraryRequest.status` (type: `ProcessingStatus`)

4. **Real-time Progress**
   - Frontend opens EventSource to `/itineraries/{requestId}/progress`
   - Backend sends progress events as agents complete
   - Frontend updates UI through progress hooks and stores

5. **Final Itinerary Retrieval**
   - User fetches completed itinerary from `/itineraries/{itineraryId}`
   - Data includes full activity breakdown with validation, cost estimates, and accessibility info

**State Management:**

- **Redis:** Stores `ItineraryRequest` objects during processing (1-hour TTL), processing timeouts
- **Supabase/PostgreSQL:** Persists completed `Itinerary` objects, user profiles, preferences
- **Browser Storage:** Form state persisted via Zustand with localStorage adapter in `requirementsStore.ts`
- **Memory:** Agent processing state during execution before Redis save

## Key Abstractions

**ItineraryRequest:**

- Purpose: Represents a single user's request flowing through the multi-agent pipeline
- Examples: `apps/functions/src/itineraries/process-request.ts`, `packages/shared/src/types/index.ts`
- Pattern: Container object with `status` field tracking pipeline progress, `processingLog` array recording each agent's execution

**Activity:**

- Purpose: Atomic unit of an itinerary - a specific action, meal, or experience
- Examples: `packages/shared/src/types/index.ts` defines structure with timing, location, cost, validation
- Pattern: Immutable data structure with validation state, persona context, accessibility info

**Agent Pipeline:**

- Purpose: Sequential processing system where agents transform/enrich itinerary content
- Pattern: Each agent is a Netlify Function that reads from Redis, processes, and triggers the next agent
- Order: Research (gather destination context) → Curation (select activities) → Validation (verify locations/costs) → Response (format output)

**UserRequirements:**

- Purpose: Standardized user input structure capturing preferences for trip generation
- Pattern: Single source of truth for user inputs, validated with Zod schemas, passed through entire pipeline
- Fields: destination, interests, duration, travelerComposition, specialRequests, accessibilityNeeds

## Entry Points

**Frontend Entry:**

- Location: `apps/web/src/app/page.tsx`
- Triggers: User navigates to `/`
- Responsibilities: Landing page, navigation to `/requirements` form or `/itinerary` display

**Requirements Form Entry:**

- Location: `apps/web/src/app/requirements/page.tsx`
- Triggers: User clicks "Create Itinerary"
- Responsibilities: Multi-step form workflow managed by `RequirementsIntakeForm.tsx`

**API Entry - Process Request:**

- Location: `apps/functions/src/itineraries/process-request.ts`
- Triggers: POST to `/.netlify/functions/itineraries-process-request`
- Responsibilities: Validate user requirements, initialize Redis state, trigger research agent

**Agent Entries:**

- Research: `apps/functions/src/agents/research.ts` - triggered by process-request
- Curation: `apps/functions/src/agents/curation.ts` - triggered by research completion
- Validation: `apps/functions/src/agents/validation.ts` - triggered by curation completion
- Response: `apps/functions/src/agents/response.ts` - triggered by validation completion

**Authentication Entries:**

- Magic Link: `apps/functions/src/auth/magic-link.ts` - POST to send login email
- Verify: `apps/functions/src/auth/verify.ts` - POST to exchange token for session
- Profile: `apps/functions/src/auth/profile.ts` - GET authenticated user profile
- Logout: `apps/functions/src/auth/logout.ts` - POST to invalidate session

## Error Handling

**Strategy:** Layered error handling with graceful degradation. Errors are captured, logged, and stored in Redis for debugging. Failed requests transition to 'failed' status and return specific error codes.

**Patterns:**

- **Frontend:** Custom error class `ItineraryAPIError` in `apps/web/src/lib/api/itinerary.ts` captures code, message, and details. API calls return `{ success: false, error: { code, message, details } }` to allow UI to handle specific error types.

- **Functions:** Response helpers in `apps/functions/src/shared/response.ts` provide consistent error response format. All functions use try-catch with specific error logging via Pino logger.

- **Agent Pipeline:** `handleAgentFailure()` in `process-request.ts` catches agent errors, updates processing log with error details, sets request status to 'failed', and stores `ProcessingError` object in `ItineraryRequest.errorDetails`.

- **Timeout Handling:** Processing timeout monitored via Redis key `processing_timeout:{requestId}`. 20-second limit enforced with exponential backoff for retry logic.

- **Validation Errors:** Zod schemas in `@swift-travel/shared` validate inputs. Validation failures return 400 status with field-level error details.

## Cross-Cutting Concerns

**Logging:** Pino logger configured in `packages/shared/src` and used throughout via `config` import. Contextual logging includes requestId, agent name, processing time. Development mode uses pino-pretty for readable output.

**Validation:** Zod schema definitions in `packages/shared/src/schemas` validate all major data structures (UserRequirements, ItineraryRequest, Activity, etc.). Validation occurs at API boundaries and before agent processing.

**Authentication:** JWT-based authentication via magic link flow. Token stored in localStorage/sessionStorage. All function calls include `Authorization: Bearer {token}` header. Internal agent-to-agent calls use `X-Internal-Token` header with shared secret from config.

**Error Tracking:** Sentry integration via `@sentry/node` and `@sentry/nextjs` configured in respective package.json files. Errors logged with context including request ID, user ID, and processing stage.

---

_Architecture analysis: 2026-03-03_

# Requirements: Swift Travel v1

## Overview

AI-powered travel concierge for domestic US trips. Specialized research agents with curated sourcing produce culturally-aware recommendations — the "friend who knows the cool spots" — assembled into flexible, proximity-smart itineraries.

## Functional Requirements

### Research Pipeline (Core Differentiator)

| ID      | Requirement                                                                | Priority | Notes                                                                                                                          |
| ------- | -------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------ |
| REQ-001 | Interest-based research agents with curated sourcing guidance per category | P1       | Fixed agent set: Food/Dining, Arts/Culture, Nightlife, Outdoors, Shopping. Each has specific blogs, subreddits, local sources. |
| REQ-002 | Research database stores structured venue/activity data                    | P1       | Schema: name, type, description, why_recommended, estimated_cost, coordinates, hours, sources, validation_status               |
| REQ-003 | QA validation agent verifies venues via Google Places API                  | P1       | Every venue must be verified. Unverifiable entries flagged or rejected. Prevents hallucinated venues.                          |
| REQ-004 | Research agents use Tavily for AI-optimized web search                     | P1       | Curated search queries per interest + location combination                                                                     |
| REQ-005 | Pipeline orchestrator manages agent execution with fan-out/fan-in pattern  | P1       | Parallel research agents → QA → concierge. State tracked in Redis.                                                             |
| REQ-006 | Each recommendation includes "why this pick" reasoning                     | P1       | Links recommendation to user's stated interests. Builds trust.                                                                 |

### Itinerary Generation

| ID      | Requirement                                                          | Priority | Notes                                                                         |
| ------- | -------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------- |
| REQ-010 | Concierge agent assembles flexible itinerary from validated research | P1       | Daily suggestions with timing context, not rigid hour-by-hour schedule        |
| REQ-011 | Location suggestion engine recommends destinations from requirements | P1       | 3-5 US destinations with rationale based on interests, duration, travelers    |
| REQ-012 | Basic itinerary view UI displays generated itinerary                 | P1       | Clean, mobile-responsive display of daily suggestions with venue details      |
| REQ-013 | Real-time progress updates during pipeline execution                 | P1       | SSE-based updates showing which agents are running. Already partially exists. |
| REQ-014 | User feedback on recommendations (thumbs up/down)                    | P1       | Stored per recommendation. Used for future prompt refinement.                 |

### User Management

| ID      | Requirement                   | Priority | Notes                                                                           |
| ------- | ----------------------------- | -------- | ------------------------------------------------------------------------------- |
| REQ-020 | Magic link authentication     | P1       | Already exists. Maintain and extend as needed.                                  |
| REQ-021 | Save and retrieve itineraries | P1       | Supabase storage. User can access past itineraries.                             |
| REQ-022 | User preference storage       | P1       | Remember interests, past destinations, dietary restrictions for returning users |

### Post-Validation Enhancements (v1.x)

| ID      | Requirement                                                | Priority | Notes                                                                  |
| ------- | ---------------------------------------------------------- | -------- | ---------------------------------------------------------------------- |
| REQ-030 | Proximity-aware activity grouping with timing intelligence | P2       | Google Distance Matrix API for real travel times. Logical meal timing. |
| REQ-031 | Token-based micropayment system                            | P2       | Stripe integration. $1 increments. Tokens consumed during generation.  |
| REQ-032 | Payment method management UI                               | P2       | Add/remove payment methods. Purchase token bundles. View balance.      |
| REQ-033 | Itinerary editing and customization                        | P2       | Swap activities, adjust timing, add/remove items. Granular edits.      |
| REQ-034 | Map visualization of itinerary                             | P3       | Visual display of activity locations on a map                          |

## Non-Functional Requirements

| ID      | Requirement                           | Priority | Notes                                                                                        |
| ------- | ------------------------------------- | -------- | -------------------------------------------------------------------------------------------- |
| NFR-001 | Mobile-responsive web UI              | P1       | Users plan travel on phones. Tailwind responsive design.                                     |
| NFR-002 | Per-request API cost budgets          | P1       | Cap OpenAI + Tavily + Google API spend per pipeline run. Prevent runaway costs.              |
| NFR-003 | Pipeline execution < 60 seconds       | P1       | User should see results within a minute. Progress updates keep them engaged.                 |
| NFR-004 | Venue data cached aggressively        | P1       | Google Places data doesn't change daily. Cache to reduce API costs.                          |
| NFR-005 | Graceful degradation on agent failure | P1       | If one research agent fails, others still produce results. Partial itinerary > no itinerary. |

## Out of Scope (v2+)

- Messaging channel integration (Telegram/Discord/WhatsApp)
- International destinations
- Hotel/flight/restaurant booking
- Mobile native app
- Collaborative/group planning
- Real-time pricing/availability
- User-generated reviews
- Price comparison/deal finding

## Requirement Dependencies

```
REQ-002 (Research DB)
  └── REQ-001 (Research Agents) depends on DB schema
  └── REQ-003 (QA Agent) depends on DB schema
       └── REQ-010 (Concierge) depends on validated data
            └── REQ-012 (Itinerary View) depends on itinerary data

REQ-011 (Location Engine) → independent, feeds into REQ-001

REQ-031 (Payments) → independent, can be added after core pipeline
REQ-030 (Proximity) → enhances REQ-010, not blocking
```

---

_Generated: 2026-03-03_

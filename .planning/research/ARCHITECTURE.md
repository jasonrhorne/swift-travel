# Architecture Research

**Domain:** AI travel concierge with multi-agent research pipeline
**Researched:** 2026-03-03
**Confidence:** MEDIUM

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                       │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────┐       │
│  │ Landing  │  │ Requirements │  │ Itinerary View/  │       │
│  │ Page     │  │ Intake Form  │  │ Edit Interface   │       │
│  └────┬─────┘  └──────┬───────┘  └────────┬─────────┘       │
├───────┴────────────────┴──────────────────┴─────────────────┤
│                       API GATEWAY                            │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────┐       │
│  │ Auth     │  │ Itinerary    │  │ Payment          │       │
│  │ Handlers │  │ Endpoints    │  │ Endpoints        │       │
│  └────┬─────┘  └──────┬───────┘  └────────┬─────────┘       │
├───────┴────────────────┴──────────────────┴─────────────────┤
│                   ORCHESTRATION LAYER                         │
│  ┌────────────────────────────────────────────────────┐      │
│  │              Pipeline Orchestrator                  │      │
│  │  (manages agent execution order, state, retries)   │      │
│  └────────────────────┬───────────────────────────────┘      │
│                       │                                       │
│  ┌─────────┐  ┌───────┴──────┐  ┌──────────┐  ┌──────────┐  │
│  │Location │  │ Research     │  │ QA       │  │Concierge │  │
│  │Suggester│  │ Agents (N)   │  │ Agent    │  │ Agent    │  │
│  └────┬────┘  └──────┬───────┘  └────┬─────┘  └────┬─────┘  │
├───────┴──────────────┴──────────────┴──────────────┴────────┤
│                      DATA LAYER                              │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────┐       │
│  │ Supabase │  │ Upstash      │  │ Research         │       │
│  │ (Users,  │  │ Redis        │  │ Database         │       │
│  │ Itin.)   │  │ (Pipeline    │  │ (Venue/Activity  │       │
│  │          │  │  State)      │  │  Data)           │       │
│  └──────────┘  └──────────────┘  └──────────────────┘       │
├─────────────────────────────────────────────────────────────┤
│                   EXTERNAL SERVICES                          │
│  ┌──────────┐  ┌──────────────┐  ┌──────────┐  ┌────────┐  │
│  │ OpenAI   │  │ Tavily       │  │ Google   │  │ Stripe │  │
│  │ (LLM)    │  │ (Web Search) │  │ Places/  │  │(Paymt) │  │
│  │          │  │              │  │ Maps     │  │        │  │
│  └──────────┘  └──────────────┘  └──────────┘  └────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component                   | Responsibility                                                         | Communicates With                                                |
| --------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Requirements Intake         | Collect user preferences (interests, duration, travelers, constraints) | API Gateway                                                      |
| Location Suggester          | Recommend 3-5 destinations based on requirements                       | OpenAI, Research DB (cached results)                             |
| Research Agents (fixed set) | Deep-dive research per interest area in selected location              | OpenAI, Tavily (web search), curated sources                     |
| Research Database           | Store validated venue/activity data with metadata                      | Research Agents (write), QA Agent (read/write), Concierge (read) |
| QA Agent                    | Validate research entries — verify existence, enrich metadata          | Google Places API, Research DB                                   |
| Concierge Agent             | Assemble flexible itinerary from validated research data               | Research DB, OpenAI (for narrative/reasoning)                    |
| Pipeline Orchestrator       | Manage agent execution order, state transitions, error handling        | Redis (state), all agents                                        |
| Itinerary View/Edit         | Display and allow user modification of generated itinerary             | API Gateway                                                      |

## Recommended Data Flow

### Full Pipeline Flow

```
User Submits Requirements
    ↓
[Location Suggester Agent]
    → Input: UserRequirements (interests, duration, travelers, constraints)
    → Process: LLM analyzes requirements, suggests 3-5 US destinations
    → Output: LocationSuggestions[] with rationale
    ↓
User Selects Location
    ↓
[Pipeline Orchestrator] → Creates pipeline state in Redis
    ↓
[Research Agents] (parallel, one per interest category)
    → Input: SelectedLocation + InterestCategory + SourcingGuidance
    → Process: LLM + Tavily web search + curated source queries
    → Output: RawResearchEntry[] written to Research Database
    ↓
[QA Validation Agent]
    → Input: RawResearchEntry[] from database
    → Process: Verify via Google Places API, enrich metadata
    → Output: ValidatedResearchEntry[] (flagged: verified/unverified/rejected)
    ↓
[Concierge Agent]
    → Input: ValidatedResearchEntry[] + UserRequirements + Duration
    → Process: Build flexible itinerary with proximity grouping
    → Output: FlexibleItinerary with daily suggestions, timing, proximity notes
    ↓
User Views Itinerary → Edits/Adapts → Saves
```

### Research Agent Internal Flow (per interest)

```
[Interest Agent: e.g., "Food & Dining"]
    ↓
1. Build search queries from location + interest + sourcing guidance
   e.g., "best new restaurants Portland 2026" + specific subreddits + Eater Portland
    ↓
2. Execute web searches via Tavily API
    ↓
3. LLM synthesizes results into structured ResearchEntry objects
   {name, type, description, whyRecommended, estimatedCost, location, sources}
    ↓
4. Write entries to Research Database (Supabase)
    ↓
5. Report completion to orchestrator
```

### Research Database Schema (key tables)

```
research_entries
├── id (uuid)
├── request_id (uuid) → links to itinerary request
├── location (text) → destination city/region
├── interest_category (text) → which agent produced this
├── name (text) → venue/activity name
├── type (enum) → restaurant, museum, shop, outdoor, nightlife, etc.
├── description (text) → what it is and why it's special
├── why_recommended (text) → connection to user's interests
├── estimated_cost (jsonb) → {min, max, currency, per_person}
├── coordinates (point) → lat/lng for proximity calculations
├── address (text)
├── operating_hours (jsonb) → structured hours by day
├── metadata (jsonb) → photos, ratings, tags, accessibility
├── sources (text[]) → URLs where info was found
├── validation_status (enum) → pending, verified, unverified, rejected
├── google_place_id (text) → from Places API verification
├── created_at (timestamp)
└── updated_at (timestamp)

itineraries
├── id (uuid)
├── user_id (uuid)
├── request_id (uuid)
├── location (text)
├── duration_days (int)
├── itinerary_data (jsonb) → full flexible itinerary structure
├── status (enum) → draft, active, completed, archived
├── tokens_consumed (int)
├── created_at (timestamp)
└── updated_at (timestamp)
```

## Architectural Patterns

### Pattern 1: Fan-Out/Fan-In Agent Execution

**What:** Research agents run in parallel (fan-out), results merge into shared database (fan-in), then single concierge agent processes all results.
**When to use:** Multiple independent research tasks that don't depend on each other.
**Trade-offs:** Faster execution, but requires orchestration complexity and result merging logic.

```typescript
// Orchestrator fans out to research agents
const agentPromises = interestCategories.map(category =>
  executeResearchAgent(location, category, sourcingGuidance[category])
);

// Fan-in: all results are in database when promises resolve
await Promise.allSettled(agentPromises);

// Single concierge agent reads all results
const itinerary = await executeConciergeAgent(requestId);
```

### Pattern 2: Shared Research Database as Communication Bus

**What:** Agents don't communicate directly. They all read from and write to the research database. The database IS the inter-agent communication mechanism.
**When to use:** When agents are independent and don't need real-time coordination.
**Trade-offs:** Simple architecture, easy to debug (just query the DB), but requires careful schema design and doesn't support real-time agent interaction.

### Pattern 3: Progressive Enhancement of Data

**What:** Each agent layer adds quality to the data. Raw research → validated research → itinerary-ready data. Never lose earlier layers.
**When to use:** When data goes through multiple processing stages.
**Trade-offs:** More storage, but full audit trail and ability to reprocess from any stage.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Agent-to-Agent Direct Calls

**What people do:** Research agent directly calls validation agent, which calls concierge agent.
**Why it's wrong:** Tight coupling, no retry isolation, impossible to rerun individual stages, debugging nightmare.
**Do this instead:** Use orchestrator + database. Each agent reads input from DB, writes output to DB. Orchestrator manages transitions.

### Anti-Pattern 2: Putting All Research in One Giant Prompt

**What people do:** Single LLM call to "research everything about Portland for a food-loving couple."
**Why it's wrong:** Context window limits, shallow results across all categories, can't use specialized sourcing per interest.
**Do this instead:** One agent per interest with curated sourcing guidance. Depth over breadth.

### Anti-Pattern 3: Skipping Validation Against Real APIs

**What people do:** Trust LLM output for venue names, addresses, hours.
**Why it's wrong:** LLMs hallucinate plausible-sounding venues that don't exist. Users lose trust immediately.
**Do this instead:** Every venue MUST be verified via Google Places API. Unverifiable recommendations get flagged or dropped.

## Scaling Considerations

| Scale        | Architecture Adjustments                                                                                                                                       |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0-100 users  | Current architecture is fine. Sequential processing OK.                                                                                                        |
| 100-1k users | Add request queuing. Cache common location research. Batch Google Places API calls.                                                                            |
| 1k-10k users | Pre-compute popular destination research (top 50 US cities). Add CDN for static content. Consider moving to longer-running compute (not 10s function timeout). |
| 10k+ users   | Research database becomes shared resource across users. Move to dedicated compute for agent execution. Consider dedicated search infrastructure.               |

### Scaling Priorities

1. **First bottleneck:** OpenAI API rate limits + cost. Mitigate with caching, cheaper models for validation, and request queuing.
2. **Second bottleneck:** Google Places API quota. Mitigate with aggressive caching (venues don't change daily).

## Suggested Build Order

Based on dependencies:

1. **Research Database schema** — everything depends on this
2. **Pipeline Orchestrator refactor** — evolve existing to support new agent types
3. **Research Agents** (one at a time, start with Food/Dining) — core value
4. **QA Validation Agent** — required before showing results to users
5. **Concierge Agent** — assembles final output
6. **Location Suggestion Engine** — can use basic logic initially
7. **Itinerary View UI** — display layer
8. **Proximity-aware grouping** — enhancement to concierge
9. **Token/Payment system** — independent, add when ready to charge

## Sources

- Multi-agent system design patterns
- LangChain.js agent orchestration documentation
- Google Places API documentation
- Serverless architecture patterns for AI applications

---

_Architecture research for: AI travel concierge_
_Researched: 2026-03-03_

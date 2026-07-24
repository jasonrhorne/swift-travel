# Phase 1 Tasks: Research Database & Agent Foundation

> Granular task breakdown for Phase 1 of the v1.0 milestone.
> Source: Codebase audit on 2026-03-03. Updated after API contract work.

## Goal

Build the research database schema and first research agent to validate the core data pipeline — specifically that interest-based research agents with curated sourcing produce genuinely interesting, culturally-aware recommendations.

## Success Criteria

- Food & Dining agent produces 8-12 venue entries for a given city
- Entries stored in `research_entries` table with structured metadata
- Entries include "why this pick" reasoning tied to user interests
- Fan-out orchestrator runs agents in parallel, fan-in collects results

---

## Tasks

### A. Research Schema & Data Layer

| #   | Task                                                                            | Depends On | Status |
| --- | ------------------------------------------------------------------------------- | ---------- | ------ |
| A1  | Add Zod schema for `research_entries` in `packages/database/src/schemas/`       | —          | DONE   |
| A2  | Create data-access repository for `research_entries` (CRUD via Supabase client) | A1         | TODO   |

**Notes:**

- Migration exists: `packages/database/src/migrations/002_research_entries.sql`
- Columns: `id`, `request_id`, `destination`, `interest`, `name`, `entry_type`, `description`, `why_recommended`, `estimated_cost`, `coordinates` (PostGIS), `address`, `hours`, `sources`, `google_place_id`, `validation_status`, `validation_details`, timestamps
- CHECK constraints: `interest` in `{food, arts-culture, nightlife, outdoors, shopping}`, `validation_status` in `{unverified, verified, rejected}`
- UNIQUE constraint on `(destination, interest, name)`
- No TypeScript-side validation exists yet

---

### B. Sourcing Guidance

| #   | Task                                                                                                      | Depends On | Status                                 |
| --- | --------------------------------------------------------------------------------------------------------- | ---------- | -------------------------------------- |
| B1  | Define `SourcingGuidance` TypeScript interface (search queries, curated sources, exclusions per interest) | —          | TODO                                   |
| B2  | Build curated sourcing config for Food & Dining agent                                                     | B1         | TODO                                   |
| B3  | Ship remaining 4 sourcing configs (Arts/Culture, Nightlife, Outdoors, Shopping)                           | B1         | DEFERRED — after vertical slice proven |

**Notes:**

- Current state: single hardcoded search query in `packages/agents/src/research/food.ts:22`
  ```
  `${destination} best new restaurants local food blog Eater Reddit`
  ```
- Each agent needs: search query templates, trusted source domains, exclusion patterns
- Per planning docs: MVP = hardcoded config, later move to database
- B3 is not blocking the vertical slice — can ship after B2 proves the pattern

---

### C. Tavily Integration

| #   | Task                                                                         | Depends On | Status |
| --- | ---------------------------------------------------------------------------- | ---------- | ------ |
| C1  | Extract Tavily client into reusable module (`packages/agents/src/tavily.ts`) | —          | TODO   |
| C2  | Wire Tavily into the deployed Food & Dining research agent                   | C1         | TODO   |

**Notes:**

- Tavily client already exists in `packages/agents/src/research/food.ts` but is not reusable
- Config key `TAVILY_API_KEY` is in `packages/shared/src/config/index.ts`
- Current deployed agent (`apps/functions/src/agents/research.ts`) uses OpenAI only — zero web search
- API: `POST https://api.tavily.com/search` with `search_depth: 'advanced'`, `max_results: 10`

---

### D. Research Agent (Food & Dining — First Real Agent)

| #   | Task                                                                                   | Depends On | Status |
| --- | -------------------------------------------------------------------------------------- | ---------- | ------ |
| D1  | Build Food & Dining research agent: Tavily search → LLM synthesis → structured entries | A1, B2, C1 | TODO   |
| D2  | Add "why this pick" reasoning to each entry (REQ-006)                                  | D1         | TODO   |
| D3  | Validate output shape against Zod schema before DB write                               | A1, D1     | TODO   |

**Notes:**

- D1 is the core vertical slice — proves the entire research pipeline works
- Pipeline: Tavily search (raw web results) → OpenAI synthesis (structured entries) → Supabase write
- Output must match `research_entries` table schema
- "Why this pick" links recommendation to user's stated interests — builds trust
- Target: 8-12 entries per city for the Food & Dining interest

---

### E. Orchestrator (Fan-Out / Fan-In)

| #   | Task                                                                                            | Depends On | Status |
| --- | ----------------------------------------------------------------------------------------------- | ---------- | ------ |
| E1  | Refactor orchestrator to fan-out to multiple research agents in parallel (`Promise.allSettled`) | D1         | TODO   |
| E2  | Fan-in: collect results from all agents, write batch to `research_entries`                      | E1, A2     | TODO   |
| E3  | Graceful degradation: if one agent fails, others still contribute (NFR-005)                     | E1         | TODO   |

**Notes:**

- Current orchestrator is strictly sequential: research → curation → validation → response
- Sequential flow lives in `apps/functions/src/itineraries/process-request.ts:316` (`getNextProcessingStep`)
- Target flow: `fan-out → [food, arts, nightlife, outdoors, shopping] → fan-in → QA → concierge`
- `Promise.allSettled` ensures partial results on individual agent failure
- State tracking already in Redis via `itinerary_request:{id}`

---

### F. Integration & Verification

| #   | Task                                                               | Depends On | Status |
| --- | ------------------------------------------------------------------ | ---------- | ------ |
| F1  | End-to-end test: Food agent produces 8-12 entries for a given city | D1, A2     | TODO   |
| F2  | Verify entries are written to `research_entries` table             | A2, F1     | TODO   |
| F3  | Cost budget: cap Tavily + OpenAI spend per pipeline run (NFR-002)  | C2         | TODO   |

**Notes:**

- F1 should use a real Tavily + OpenAI call (or mocked for CI) against a known city
- F2 validates the full data path from agent → Supabase
- F3 prevents runaway costs — budget should be configurable per request

---

## Dependency Graph

```
A1 ─┬─→ A2 ──────────────────────→ E2 ─→ F2
    │                              ↑
B1 ─┼─→ B2 ─┐                      │
    │        │                      │
C1 ─┼─→ C2 ─┤                      │
    │        │                      │
    └────────┴─→ D1 ─→ D2          │
                  │   D3           │
                  │                │
                  └─→ E1 ─→ E3 ───┘
                        │
                        └─→ F1 ──→ F2
                              │
                              └─→ F3 (independent)
```

**Critical path:** A1 → B1 → B2 → C1 → C2 → D1 → E1 → F1 → F2

## Recommendation

Start with the **Food & Dining vertical slice** (A1 → A2 → B1 → B2 → C1 → C2 → D1 → D2 → D3 → F1 → F2). This proves the pattern end-to-end before building the other 4 agents and the fan-out orchestrator.

---

_Generated: 2026-03-03_

# Roadmap: Swift Travel v1

## Milestone: v1.0 — Validate Core Research Pipeline

**Goal:** Prove that interest-based research agents with curated sourcing produce genuinely interesting, culturally-aware recommendations — and that users can see and interact with them.

**Success criteria:**

- Research agents produce recommendations users can't easily find on TripAdvisor
- Every displayed venue is verified via Google Places API
- User can go from requirements → location → itinerary in under 60 seconds
- Itinerary is flexible (daily suggestions, not rigid schedule)

---

### Phase 1: Research Database & Agent Foundation

**Goal:** Build the research database schema and first research agent to validate the core data pipeline.

**Requirements:** REQ-002, REQ-004, REQ-005 (partial)

**Delivers:**

- Research database schema in Supabase (research_entries table)
- Pipeline orchestrator refactored for fan-out/fan-in pattern
- First research agent (Food & Dining) with Tavily web search
- Curated sourcing guidance structure for the Food agent
- Agent writes structured entries to research database

**Success criteria:** Food & Dining agent produces 8-12 venue entries for a given city, stored in research database with structured metadata.

**Research flag:** YES — needs design of sourcing guidance format and Tavily integration patterns

---

### Phase 2: QA Validation & Full Agent Set

**Goal:** Ensure data quality via validation and expand to all interest categories.

**Requirements:** REQ-001, REQ-003, REQ-006

**Delivers:**

- QA validation agent with Google Places API verification
- Remaining research agents: Arts/Culture, Nightlife, Outdoors, Shopping
- "Why this pick" reasoning on each recommendation
- Validation status tracking (verified/unverified/rejected)

**Success criteria:** All 5 research agents produce validated results. >80% of recommendations pass Google Places verification.

**Research flag:** NO — follows patterns established in Phase 1

---

### Phase 3: Concierge Agent & Itinerary UI

**Goal:** Turn validated research into a user-facing flexible itinerary.

**Requirements:** REQ-010, REQ-011, REQ-012, REQ-013, REQ-014

**Delivers:**

- Concierge agent assembles flexible itinerary from validated research
- Location suggestion engine (3-5 destinations from requirements)
- Itinerary view UI (mobile-responsive, daily suggestions)
- Real-time SSE progress updates during pipeline
- Thumbs up/down feedback on recommendations

**Success criteria:** User can submit requirements → select location → see flexible itinerary with verified venues, reasoning, and practical info.

**Research flag:** NO — standard patterns

---

### Phase 4: User Management & Polish

**Goal:** Complete the user flow with persistence, preferences, and UI polish.

**Requirements:** REQ-020, REQ-021, REQ-022, NFR-001

**Delivers:**

- Magic link auth flow verified and extended
- Save/retrieve itineraries
- User preference storage (interests, dietary, past trips)
- Mobile-responsive polish pass
- Cost budgets and caching (NFR-002, NFR-004)

**Success criteria:** Returning user can log in, see past itineraries, and get better recommendations from stored preferences.

**Research flag:** NO — extends existing auth system

---

## Phase Dependency Graph

```
Phase 1 (DB + First Agent)
    └── Phase 2 (QA + Full Agent Set) — depends on Phase 1
         └── Phase 3 (Concierge + UI) — depends on Phase 2
              └── Phase 4 (User Mgmt + Polish) — depends on Phase 3
```

All phases are sequential — each builds on the previous.

## Future Milestones

### v1.x — Post-Validation Enhancements

- Proximity-aware grouping (REQ-030)
- Token payments + Stripe (REQ-031, REQ-032)
- Itinerary editing (REQ-033)
- Map visualization (REQ-034)

### v2.0 — Expansion

- Messaging channels (Telegram/Discord/WhatsApp)
- International destinations
- Collaborative planning

---

_Generated: 2026-03-03_

# Swift Travel

## What This Is

An AI-powered travel concierge for domestic US trips that goes beyond typical tourist recommendations. Swift Travel understands your travel preferences and uses specialized research agents to find the culturally-aware picks — the new restaurants, the cool art galleries, the local gems — then assembles them into a flexible, proximity-smart itinerary. Users interact primarily through a web UI, with messaging channels (Telegram, Discord, WhatsApp) planned for future itinerary management.

## Core Value

The agent research pipeline must produce genuinely interesting, culturally-aware recommendations that go beyond what you'd find on TripAdvisor — that's the assumption to validate first.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- ✓ Monorepo structure with shared TypeScript packages — existing
- ✓ Multi-step requirements intake form (interests, duration, travelers) — existing
- ✓ Multi-agent pipeline architecture (Research → Curation → Validation → Response) — existing
- ✓ Magic link authentication flow — existing
- ✓ Supabase database integration — existing
- ✓ Redis state management for pipeline processing — existing
- ✓ Real-time progress updates via SSE — existing
- ✓ Netlify Functions serverless deployment — existing

### Active

- [ ] Research agents produce quality, culturally-aware recommendations using LLM + web sources
- [ ] Fixed set of interest-based research agents with curated sourcing guidance (local blogs, subreddits, etc.)
- [ ] Location suggestion engine — recommend destinations based on high-level travel requirements
- [ ] Concierge agent that builds flexible itineraries from the research database
- [ ] Proximity-aware activity grouping with timing suggestions
- [ ] QA agent validates research database entries with appropriate metadata
- [ ] User can view, adapt, and manage their generated itinerary
- [ ] Token-based micropayment system ($1 for X tokens, consumed during generation/manipulation)
- [ ] Payment method management on web UI

### Out of Scope

- Messaging channel integration (Telegram/Discord/WhatsApp) — v2, web-first for now
- International travel — domestic US only for v1
- Hotel/flight booking — recommendations only, no transactional booking
- Mobile native app — web-first
- Group/collaborative planning — single user for v1
- Real-time pricing/availability — static recommendations with general cost guidance

## Context

**Existing codebase:** Early prototype with working monorepo structure (Next.js frontend, Netlify Functions backend, Supabase DB, Upstash Redis). The agent pipeline architecture exists but needs refinement — current agents are generic and don't produce the quality of culturally-aware results that differentiate Swift Travel.

**Target user:** Busy professionals who appreciate recommendations beyond the typical. Swift Travel is your culturally-aware friend who knows the new restaurants, the coolest art galleries, the hidden shops. Not a mass-market travel planner.

**Agent architecture:** Fixed set of interest-based research agents, each with specific sourcing guidance to find quality results. Agents contribute to a shared database that a concierge agent uses to assemble the final itinerary.

**Revenue model:** Token-based micropayments. Users purchase tokens ($1 increments) and spend them when generating or manipulating itineraries. Web UI required for payment method setup.

## Constraints

- **Platform**: Netlify for hosting/functions, Supabase for database, Upstash for Redis — existing infrastructure
- **AI Provider**: OpenAI for agent LLM calls — already integrated
- **Stack**: TypeScript monorepo with Next.js, React, Tailwind — existing and working
- **Scope**: Domestic US travel only — simplifies location data, regulations, currency
- **Auth**: Magic link flow already implemented — keep and extend

## Key Decisions

| Decision                                       | Rationale                                                                       | Outcome   |
| ---------------------------------------------- | ------------------------------------------------------------------------------- | --------- |
| Fixed research agent set over dynamic          | Curated sourcing guidance per agent produces better quality than generic agents | — Pending |
| Web-first, messaging later                     | Need payment method on file; web UI provides richer itinerary interaction       | — Pending |
| Token micropayments over subscription          | Lower barrier to entry; users pay for what they use                             | — Pending |
| Flexible itinerary over rigid schedule         | Users want suggestions with smart proximity/timing, not minute-by-minute plans  | — Pending |
| Keep existing stack (Next.js/Netlify/Supabase) | Early prototype already built on this; no reason to change                      | — Pending |

---

_Last updated: 2026-03-03 after initialization_

# Research Summary: Swift Travel

**Domain:** AI-powered travel concierge with multi-agent research pipeline
**Researched:** 2026-03-03
**Overall confidence:** MEDIUM

## Executive Summary

Swift Travel's core differentiator — culturally-aware recommendations from curated sources — is technically feasible with the existing stack plus targeted additions. The key insight is that recommendation quality depends entirely on **agent sourcing guidance** (which blogs, subreddits, and local sources each interest agent searches), not just LLM capability. This is the product moat and deserves the most design attention.

The existing pipeline architecture (Research → Curation → Validation → Response) needs evolution rather than replacement. The main changes: split the single research agent into interest-specific agents running in parallel, add a QA validation agent that verifies venues via Google Places API, and build a concierge agent that assembles proximity-aware flexible itineraries from validated research data.

The biggest technical risks are LLM hallucination of venues (requires mandatory validation against real APIs) and uncontrolled API costs (requires per-request budgets from day one). The biggest product risk is building research agents that return the same generic recommendations anyone could find on TripAdvisor — the curated sourcing guidance per interest category IS the product.

Token-based micropayments via Stripe are straightforward but should be added after the core research pipeline proves its value. Proximity-aware grouping requires Google Maps Distance Matrix API (not naive lat/lng distance) but can be added as an enhancement after basic itinerary generation works.

## Key Findings

**Stack:** Keep existing (Next.js/Netlify/Supabase/Redis/OpenAI). Add LangChain.js for agent orchestration, Tavily for AI-optimized web search, Google Places for venue verification, Google Distance Matrix for proximity, Stripe for payments, Turf.js for geospatial clustering.

**Architecture:** Fan-out/fan-in pattern — parallel interest agents write to shared research database, QA agent validates, concierge agent assembles itinerary. Database is the inter-agent communication bus (no direct agent-to-agent calls).

**Table stakes:** Destination recommendations, multi-day itinerary, activity details with practical info, save/retrieve, edit/customize.

**Differentiator:** Curated sourcing guidance per interest agent (local blogs, specific subreddits, regional food critics) — this is the ENTIRE competitive advantage.

**Critical pitfall:** Hallucinated venues. Never show LLM-generated venue data without verification against Google Places API.

## Implications for Roadmap

Based on research, suggested phase structure:

1. **Research Agent Pipeline** — Build the core differentiator first
   - Addresses: Interest-based research agents, research database, QA validation
   - Avoids: Hallucinated venues pitfall, generic recommendations pitfall
   - Build order: Database schema → research agents (one interest at a time) → QA agent

2. **Concierge & Itinerary** — Turn research into user-facing output
   - Addresses: Concierge agent, flexible itinerary assembly, basic itinerary UI
   - Avoids: Over-optimization pitfall, operating hours pitfall
   - Build order: Concierge agent → itinerary view → edit/customize

3. **Location Engine & Polish** — Complete the user flow
   - Addresses: Location suggestion, proximity grouping, UI polish
   - Build order: Location suggester → proximity enhancement → UI refinement

4. **Payments & Launch** — Monetize validated product
   - Addresses: Token system, Stripe integration, payment UI
   - Avoids: Token race condition pitfall, cost estimation pitfall

**Phase ordering rationale:**

- Research pipeline first because it's the core assumption to validate (do agents produce quality results?)
- Concierge second because users need to SEE the research output to evaluate quality
- Location engine third because basic "pick a city" works initially — intelligence can be added
- Payments last because you shouldn't charge until the core value is proven

**Research flags for phases:**

- Phase 1: Needs careful design of sourcing guidance per agent (the product moat)
- Phase 2: Standard patterns, unlikely to need research
- Phase 3: May need research on geospatial clustering algorithms
- Phase 4: Standard Stripe integration, well-documented

## Confidence Assessment

| Area         | Confidence | Notes                                                                                                                                |
| ------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Stack        | MEDIUM     | Core additions (LangChain, Tavily, Google Places) are well-established. Version specifics should be verified at implementation time. |
| Features     | MEDIUM     | Based on competitor analysis and travel industry patterns. Prioritization aligns with "validate core assumption first" strategy.     |
| Architecture | MEDIUM     | Fan-out/fan-in is standard for multi-agent systems. Specific to Swift Travel's needs but should be validated with prototype.         |
| Pitfalls     | HIGH       | Hallucination and cost spiraling are well-documented issues in LLM applications. Prevention strategies are battle-tested.            |

## Gaps to Address

- Specific Tavily API pricing and rate limits (verify before committing)
- Google Places API cost at scale (free tier limits may matter)
- Optimal number of interest categories for fixed agent set (start with 5-6, expand based on user demand)
- Specific local blogs/subreddits per region (need to curate per US metro area)
- Stripe minimum transaction amount for token purchases (verify $1 is viable)

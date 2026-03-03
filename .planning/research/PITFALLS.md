# Pitfalls Research

**Domain:** AI-powered travel concierge with multi-agent pipeline
**Researched:** 2026-03-03
**Confidence:** MEDIUM

## Critical Pitfalls

### Pitfall 1: LLM-Hallucinated Venues and Businesses

**What goes wrong:**
LLMs confidently generate plausible-sounding but entirely fictional restaurants, galleries, shops, and attractions. Users try to visit recommended places that don't exist, immediately destroying trust.

**Why it happens:**
LLMs pattern-match "what a cool restaurant in Portland would sound like" rather than recalling factual data. Training data is also 6-18 months stale — venues open and close constantly.

**How to avoid:**

- NEVER show LLM-generated venue data without verification against Google Places API
- Use LLMs for synthesis and reasoning, APIs for factual data (name, address, hours, existence)
- Flag unverifiable recommendations as "unconfirmed" rather than silently including them
- Cache verified venues to reduce API costs on re-queries

**Warning signs:**

- Venue names that sound generic ("The Artisan's Table", "Gallery on Main")
- Addresses that don't geocode correctly
- No Google Place ID match
- Descriptions that could apply to any city

**Phase to address:** Phase 1 — QA validation agent must be built into initial pipeline

---

### Pitfall 2: Uncontrolled API Cost Spiraling

**What goes wrong:**
Each itinerary request triggers multiple LLM calls (research agents + concierge), web searches (Tavily), and location verifications (Google Places). Without budgets, a single request can cost $5-10+ in API calls, making the $1 token pricing model unsustainable.

**Why it happens:**
Developers focus on quality first and cost second. Agent prompts grow, retry logic is generous, and there's no per-request cost ceiling.

**How to avoid:**

- Set hard token budgets per agent call (e.g., max 4K output tokens per research agent)
- Track cost per request in real-time, abort if exceeding budget
- Use cheaper models for validation/parsing tasks (GPT-3.5-turbo or similar)
- Cache aggressively — if someone researched "food in Portland" yesterday, reuse research
- Pre-compute popular destination data instead of real-time research

**Warning signs:**

- Average cost per itinerary > $2 (target should be < $0.50)
- Retry storms in logs
- Research agents producing 10K+ token outputs

**Phase to address:** Phase 1 — cost controls must be designed into agent architecture from day one

---

### Pitfall 3: Proximity Optimization Using Straight-Line Distance

**What goes wrong:**
Grouping activities by geographic proximity using lat/lng distance produces itineraries that look logical on a map but require impractical travel (crossing rivers, navigating one-way streets, avoiding construction).

**Why it happens:**
Haversine distance is easy to calculate. Actual travel time requires API calls and is mode-dependent.

**How to avoid:**

- Use Google Maps Distance Matrix API for actual travel times between grouped activities
- Factor in transportation mode (walking, driving, transit)
- Include time-of-day in calculations (rush hour in Manhattan vs. 10am)
- Cache common routes per city

**Warning signs:**

- Activities on opposite sides of a river grouped together
- 10-minute walking estimates that take 30 minutes via transit
- No difference between morning and evening route times

**Phase to address:** Phase with proximity implementation — use Distance Matrix, not Haversine

---

### Pitfall 4: Research Agents All Using Same Generic Approach

**What goes wrong:**
Despite being "interest-based," all research agents use the same prompt template and same search queries, producing results that are barely differentiated from each other or from basic Google searches.

**Why it happens:**
It's tempting to build one generic research agent and just swap the interest keyword. But "search for [interest] in [city]" produces the same TripAdvisor/Yelp results anyone could find.

**How to avoid:**

- Each agent MUST have curated sourcing guidance specific to its interest
  - Food agent: Eater local edition, r/food[city], local food bloggers, James Beard nominations
  - Art/culture agent: local arts council, gallery district blogs, r/[city] threads about openings
  - Outdoors agent: AllTrails, local hiking groups, r/hiking threads about the region
- Sourcing guidance is the product differentiator — invest heavily here
- Test each agent independently: "Would a local recommend these places?"

**Warning signs:**

- All agents returning results from the same 3-4 sources
- Recommendations that appear on first page of Google for "[city] things to do"
- No difference in recommendation quality between agents

**Phase to address:** Phase 1 — agent sourcing guidance is the core differentiator, must be right from start

---

## Moderate Pitfalls

### Pitfall 5: Ignoring Operating Hours in Itinerary Assembly

**What goes wrong:**
Concierge agent creates a logical day plan that schedules museum visits on Mondays (closed), dinner reservations at 3pm, or morning activities at venues that open at noon.

**Prevention:**

- Fetch and store operating hours during QA validation
- Concierge agent must treat hours as hard constraints
- Build time-slot awareness: breakfast spots (7-10am), lunch (11:30-2pm), dinner (6-9pm)
- Check day-of-week availability
- Add buffer time between activities (15-30 min transit + settling)

**Phase to address:** Concierge agent implementation

---

### Pitfall 6: Token Balance Race Conditions

**What goes wrong:**
User with 5 tokens submits request costing 4 tokens. During processing, they submit another request. Both deduct from the same balance, resulting in -3 tokens.

**Prevention:**

- Use database transactions with row-level locking for balance checks
- Pre-authorize (hold) tokens before pipeline starts, settle after completion
- Add idempotency keys to prevent duplicate charges
- Implement "pending" balance that accounts for in-flight requests

**Phase to address:** Payment implementation phase

---

### Pitfall 7: No Graceful Degradation When External APIs Fail

**What goes wrong:**
Google Places API rate limit hit → QA agent fails → entire pipeline fails → user gets error after waiting 30 seconds.

**Prevention:**

- QA agent should degrade gracefully: mark venues as "unverified" instead of failing
- Research agents should work without Tavily (fall back to LLM knowledge, flag as lower confidence)
- Show partial results with confidence indicators rather than all-or-nothing
- Implement circuit breakers per external service

**Phase to address:** Pipeline orchestrator design (Phase 1)

---

### Pitfall 8: Cold Start Latency in Serverless Functions

**What goes wrong:**
First request after idle period takes 10-30+ seconds because Netlify Functions cold-start, Redis connections initialize, etc. User thinks app is broken.

**Prevention:**

- Add prominent loading states with progress indicators (SSE already exists)
- Consider Netlify Edge Functions for latency-sensitive operations
- Keep connection pools warm with scheduled pings
- Optimize function bundle sizes (tree-shaking, lazy imports)

**Phase to address:** Polish/optimization phase

---

## Technical Debt Patterns

| Shortcut                               | Immediate Benefit    | Long-term Cost                                      | When Acceptable                            |
| -------------------------------------- | -------------------- | --------------------------------------------------- | ------------------------------------------ |
| Hardcoded sourcing guidance per agent  | Quick to build       | Hard to update, no admin UI                         | MVP only — plan to move to database/config |
| Single OpenAI model for all agents     | Simpler code         | Overpaying for simple tasks                         | MVP — plan multi-model later               |
| No caching of research results         | Simpler architecture | Repeated API costs, slower for popular destinations | Never — add basic caching from start       |
| Storing itinerary as unstructured JSON | Flexible schema      | Hard to query, no partial updates                   | MVP — plan structured schema for v1.x      |

## Integration Gotchas

| Integration          | Common Mistake                                        | Correct Approach                                                                 |
| -------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------- |
| OpenAI API           | Not handling rate limits (429 errors)                 | Implement exponential backoff with jitter, use p-limit for concurrency           |
| Google Places API    | Exceeding free tier unknowingly                       | Monitor quota daily, cache aggressively, batch nearby searches                   |
| Stripe micropayments | Minimum charge amounts ($0.50 Stripe minimum)         | Sell tokens in $1+ bundles, deduct from balance in-app                           |
| Tavily API           | Trusting search results without validation            | Cross-reference with Google Places, treat as leads not facts                     |
| Supabase             | Hitting connection pool limits from concurrent agents | Use connection pooling (pgbouncer), limit concurrent DB connections per function |

## Performance Traps

| Trap                          | Symptoms                        | Prevention                                              | When It Breaks                            |
| ----------------------------- | ------------------------------- | ------------------------------------------------------- | ----------------------------------------- |
| Sequential agent execution    | 60+ second total pipeline time  | Parallelize independent research agents                 | First user test                           |
| Unbounded LLM output          | Slow responses, high token cost | Set max_tokens on all API calls                         | Cost review                               |
| No research caching           | Same queries re-executed daily  | Cache research entries by location+interest, TTL 7 days | 10+ users hitting same cities             |
| Large JSON itinerary payloads | Slow page loads, high memory    | Paginate by day, lazy-load details                      | Multi-day itineraries with 50+ activities |

## "Looks Done But Isn't" Checklist

- [ ] **Research agents:** Do they find places a LOCAL would recommend? (Test with someone who lives there)
- [ ] **QA validation:** Does it actually verify places EXIST, or just check format?
- [ ] **Proximity grouping:** Does it use TRAVEL TIME or just distance?
- [ ] **Operating hours:** Checked for the ACTUAL DAY of the trip, not just "usually open"?
- [ ] **Token accounting:** Does balance update BEFORE or AFTER pipeline completes? (Should be: hold before, settle after)
- [ ] **Error handling:** What does user see when pipeline fails at step 3 of 5? (Should see: partial results + explanation)
- [ ] **Mobile responsiveness:** Does itinerary view work on phone? (Users plan travel on mobile)

## Pitfall-to-Phase Mapping

| Pitfall                 | Prevention Phase          | Verification                                        |
| ----------------------- | ------------------------- | --------------------------------------------------- |
| Hallucinated venues     | Phase 1 (QA Agent)        | Spot-check 20 recommendations against Google Maps   |
| Cost spiraling          | Phase 1 (Architecture)    | Track cost per request, alert if > $1               |
| Generic research agents | Phase 1 (Research Agents) | Have locals evaluate recommendations                |
| Straight-line distance  | Proximity phase           | Compare suggested routes vs. Google Maps directions |
| Operating hours ignored | Concierge phase           | Verify 5 itineraries against actual venue hours     |
| Token race conditions   | Payment phase             | Load test concurrent token operations               |
| Cold start latency      | Polish phase              | Measure time-to-first-byte after 30min idle         |

## Sources

- Common LLM application failure modes
- Multi-agent system design pitfalls
- Travel industry API integration patterns
- Serverless architecture limitations
- Micropayment system design considerations

---

_Pitfalls research for: AI travel concierge_
_Researched: 2026-03-03_

# Feature Research

**Domain:** AI-powered travel concierge — "culturally-aware friend" positioning
**Researched:** 2026-03-03
**Confidence:** MEDIUM

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature                                          | Why Expected                                  | Complexity | Notes                                            |
| ------------------------------------------------ | --------------------------------------------- | ---------- | ------------------------------------------------ |
| Destination recommendations based on preferences | Core value prop — users come for this         | MEDIUM     | Must work well or nothing else matters           |
| Multi-day itinerary generation                   | Every travel planner does this                | HIGH       | The quality differentiates, not the existence    |
| Activity descriptions with practical info        | Users need address, hours, cost estimates     | MEDIUM     | Requires validation against real data            |
| Save and retrieve itineraries                    | Users expect persistence                      | LOW        | Already have Supabase for storage                |
| User accounts with preferences                   | Returning users expect remembered preferences | LOW        | Magic link auth already exists                   |
| Mobile-responsive web UI                         | Users plan travel on phones                   | MEDIUM     | Next.js + Tailwind should handle this            |
| Edit/customize generated itinerary               | Users always want to tweak results            | MEDIUM     | Must support granular edits, not just regenerate |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature                                                          | Value Proposition                                                 | Complexity | Notes                                                                   |
| ---------------------------------------------------------------- | ----------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------- |
| Culturally-aware recommendations (local gems, not tourist traps) | THE differentiator. "Your friend who knows the cool spots"        | HIGH       | Requires curated sourcing, not just LLM knowledge. This is the product. |
| Interest-based research agents with curated sources              | Quality over quantity — agents that know where to look            | HIGH       | Fixed agent set with specific blog/subreddit guidance per interest      |
| Proximity-aware grouping with timing intelligence                | "You're near this great coffee shop after the museum"             | HIGH       | Requires geospatial + operating hours + logical meal timing             |
| Flexible itinerary format (menu of options, not rigid schedule)  | Users hate rigid hour-by-hour plans                               | MEDIUM     | Present as suggestions with proximity/timing context                    |
| Explanation of why each recommendation was chosen                | Builds trust — "recommended because you said you love street art" | LOW        | Add reasoning field to each recommendation                              |
| Token-based pay-per-use pricing                                  | Lower barrier than subscription for occasional travelers          | MEDIUM     | Stripe integration, token accounting                                    |
| Feedback loop (thumbs up/down on recommendations)                | Improves quality over time, builds user investment                | LOW        | Store feedback, use for future prompting                                |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature                               | Why Requested           | Why Problematic                                                                                          | Alternative                                                                              |
| ------------------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Real-time booking integration         | "One-click booking!"    | Massive complexity, liability, requires partnerships with every venue/restaurant. Maintenance nightmare. | Provide direct links to venue websites/OpenTable/etc. Let user book themselves.          |
| Social/collaborative trip planning    | "Plan with friends!"    | Multiplies UX complexity (permissions, conflicts, voting). Kills solo-user simplicity.                   | v2+ feature. For now, share itinerary via link.                                          |
| AI chatbot for free-form conversation | "Just talk to it!"      | Uncontrolled scope, hard to guide toward quality output, expensive in tokens                             | Structured intake form → agent pipeline → structured output. Chat for refinement only.   |
| Price comparison / deal finding       | "Find me the cheapest!" | Requires real-time pricing APIs, constant maintenance, races to bottom                                   | Provide general cost estimates. Position as quality curator, not bargain hunter.         |
| User-generated reviews/ratings        | "Build a community!"    | Content moderation, spam, cold-start problem, drift from core value                                      | Use curated external sources (Eater, local blogs) rather than building own review system |
| Comprehensive world coverage          | "Add international!"    | Data quality varies dramatically by region. Domestic US is already huge.                                 | Domestic US only. Nail quality before expanding geography.                               |

## Feature Dependencies

```
[Requirements Intake Form]
    └──requires──> [Location Suggestion Engine]
                       └──requires──> [Interest-Based Research Agents]
                                          └──requires──> [Research Database / QA Validation]
                                                             └──requires──> [Concierge Agent / Itinerary Assembly]
                                                                                └──requires──> [Itinerary View / Edit UI]

[Token System] ──enhances──> [Itinerary Generation] (gates access)

[Proximity Grouping] ──enhances──> [Concierge Agent] (improves output quality)

[Feedback Loop] ──enhances──> [Research Agents] (improves over time)
```

### Dependency Notes

- **Research Agents require Location Suggestion**: Agents need to know WHERE to research before they can research WHAT
- **Concierge Agent requires Research Database**: Can't build itinerary without populated research data
- **Token System is independent**: Can be added alongside or after core pipeline without blocking
- **Proximity Grouping enhances Concierge**: Can start without it (basic itinerary), add proximity intelligence later

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the core assumption (that agent research produces quality, culturally-aware results).

- [ ] Interest-based research agents with curated sourcing — the core differentiator
- [ ] Research database with QA validation — ensures data quality
- [ ] Concierge agent that assembles flexible itinerary from research — the output users see
- [ ] Basic itinerary view UI — users need to see results
- [ ] Location suggestion based on requirements — users need a starting point

### Add After Validation (v1.x)

Features to add once core research quality is validated.

- [ ] Proximity-aware grouping — when itinerary basics work, add spatial intelligence
- [ ] Token-based payments — when users want to pay for the value
- [ ] Itinerary editing/customization — when users want to tweak
- [ ] Recommendation explanations — when trust needs building
- [ ] Feedback loop — when there's enough usage to learn from

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] Messaging channel integration (Telegram/Discord/WhatsApp) — after web experience is solid
- [ ] Collaborative planning — after solo experience is polished
- [ ] International destinations — after US quality is proven
- [ ] Map visualization — nice but not essential for validation

## Feature Prioritization Matrix

| Feature                           | User Value | Implementation Cost | Priority |
| --------------------------------- | ---------- | ------------------- | -------- |
| Interest-based research agents    | HIGH       | HIGH                | P1       |
| Research database + QA validation | HIGH       | MEDIUM              | P1       |
| Concierge itinerary assembly      | HIGH       | HIGH                | P1       |
| Location suggestion engine        | HIGH       | MEDIUM              | P1       |
| Basic itinerary view              | HIGH       | LOW                 | P1       |
| Itinerary edit/customize          | MEDIUM     | MEDIUM              | P2       |
| Proximity-aware grouping          | MEDIUM     | HIGH                | P2       |
| Token payments                    | MEDIUM     | MEDIUM              | P2       |
| Recommendation explanations       | MEDIUM     | LOW                 | P2       |
| Feedback loop                     | LOW        | LOW                 | P3       |
| Map visualization                 | LOW        | MEDIUM              | P3       |

## Competitor Feature Analysis

| Feature                | Wanderlog              | Tripsy               | ChatGPT Travel     | Our Approach                                        |
| ---------------------- | ---------------------- | -------------------- | ------------------ | --------------------------------------------------- |
| Itinerary generation   | Manual + AI assist     | Manual templates     | Pure conversation  | Agent pipeline with curated sources                 |
| Recommendation quality | Generic/crowdsourced   | None (planning only) | LLM knowledge only | Curated local sources + LLM + validation            |
| Proximity awareness    | Basic map clustering   | None                 | None               | Proximity + timing + logical flow                   |
| Pricing model          | Freemium/subscription  | One-time purchase    | ChatGPT Plus sub   | Token micropayments                                 |
| Unique positioning     | Collaborative planning | Beautiful UI/offline | Conversational     | "Culturally-aware friend" with real local knowledge |

## Sources

- Competitor app analysis (Wanderlog, Tripsy, TripIt, Google Travel)
- AI travel startup landscape review
- Travel industry feature expectations research
- Micropayment model analysis (gaming industry parallels)

---

_Feature research for: AI travel concierge_
_Researched: 2026-03-03_

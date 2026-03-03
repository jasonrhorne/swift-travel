# Stack Research

**Domain:** AI-powered travel concierge with multi-agent research pipeline
**Researched:** 2026-03-03
**Confidence:** MEDIUM

## Existing Stack (Keep)

Already in place and working — no changes needed:

| Technology        | Version        | Purpose              | Status |
| ----------------- | -------------- | -------------------- | ------ |
| Next.js           | 14.0.0         | Frontend SSR/SSG     | Keep   |
| React             | 18.2.0         | UI components        | Keep   |
| Tailwind CSS      | 3.4.0          | Styling              | Keep   |
| Zustand + Immer   | 4.4.0 / 10.1.3 | State management     | Keep   |
| TypeScript        | 5.3.0          | Type safety          | Keep   |
| Netlify Functions | 4.2.5          | Serverless API       | Keep   |
| Supabase          | 2.0.0          | PostgreSQL database  | Keep   |
| Upstash Redis     | 1.35.3         | Pipeline state/cache | Keep   |
| OpenAI SDK        | 4.104.0        | LLM agent calls      | Keep   |
| Zod               | 3.22.0         | Schema validation    | Keep   |
| Pino              | 8.0.0          | Structured logging   | Keep   |
| Sentry            | 7.0.0          | Error tracking       | Keep   |

## New Technologies Needed

### AI Agent Enhancement

| Technology        | Version | Purpose                                          | Why Recommended                                                                                                                 |
| ----------------- | ------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| LangChain.js      | 0.3.x   | Agent orchestration, tool use, structured output | Provides web search tool integration, output parsing, and chain composition. Avoids building custom orchestration from scratch. |
| Tavily API        | latest  | AI-optimized web search for agents               | Purpose-built for LLM agent web search. Returns clean, structured results. Better than raw Google search for agent consumption. |
| Google Places API | latest  | Location verification and metadata               | Validates LLM-recommended places actually exist. Provides hours, ratings, photos, coordinates.                                  |

### Geospatial / Proximity

| Technology                      | Version | Purpose                                              | Why Recommended                                                                                                 |
| ------------------------------- | ------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Google Maps Distance Matrix API | latest  | Real travel time between locations                   | Actual driving/walking/transit times, not crow-flies distance. Time-of-day aware.                               |
| @turf/turf                      | 7.x     | Geospatial calculations (clustering, bounding boxes) | Lightweight geospatial library for grouping nearby activities. Runs server-side without heavy GIS dependencies. |

### Payments

| Technology        | Version | Purpose                             | Why Recommended                                                                                                            |
| ----------------- | ------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Stripe            | latest  | Payment processing, token purchases | Industry standard for micropayments. Supports one-time charges, stored payment methods, webhooks. Low minimum transaction. |
| @stripe/stripe-js | latest  | Frontend Stripe Elements            | PCI-compliant payment form integration.                                                                                    |

### Supporting Libraries

| Library  | Version | Purpose                                      | When to Use                                                        |
| -------- | ------- | -------------------------------------------- | ------------------------------------------------------------------ |
| p-limit  | 6.x     | Concurrency control for parallel agent calls | Prevent overwhelming OpenAI/search APIs with concurrent requests   |
| nanoid   | 5.x     | Short unique IDs for itineraries/tokens      | Already have uuid, but nanoid is better for user-facing IDs        |
| date-fns | 3.x     | Date manipulation for itinerary scheduling   | Operating hours parsing, time slot calculations, day-of-week logic |
| sharp    | 0.33.x  | Image processing for venue photos            | Resize/optimize venue images from Google Places for fast loading   |

## Installation

```bash
# AI Agent Enhancement
npm install langchain @langchain/openai @langchain/community

# Geospatial
npm install @turf/turf

# Payments
npm install stripe @stripe/stripe-js

# Supporting
npm install p-limit nanoid date-fns

# Dev dependencies (if not already present)
npm install -D @types/google.maps
```

## Alternatives Considered

| Recommended   | Alternative               | Why Not                                                                                                                                           |
| ------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tavily        | SerpAPI, Brave Search API | Tavily is purpose-built for AI agents — returns structured, clean content. Others return raw search results requiring more parsing                |
| LangChain.js  | Custom orchestration      | LangChain provides tool integration, structured output parsing, retry logic out of the box. Custom is viable but slower to build                  |
| Stripe        | Square, Paddle            | Stripe has best micropayment support, lowest minimums, best developer experience. Most established for token-based billing                        |
| Google Places | Yelp Fusion, Foursquare   | Google has broadest coverage for US domestic travel. Yelp has better reviews but worse API. Foursquare declining                                  |
| Turf.js       | PostGIS (in Supabase)     | Turf runs in serverless functions without DB dependency. PostGIS is overkill for clustering/proximity — save it for complex spatial queries later |

## What NOT to Use

| Avoid                             | Why                                                                        | Use Instead                                  |
| --------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------- |
| Puppeteer/Playwright for scraping | Slow, fragile, expensive in serverless. Rate-limited. Legal risks.         | Tavily API or curated RSS feeds for content  |
| Raw Google Search API             | Returns SEO-optimized pages, not useful content for agents                 | Tavily for AI-optimized search results       |
| Mapbox for proximity              | Overkill for backend proximity calculations. Good for frontend maps later. | Google Distance Matrix + Turf.js for backend |
| Crypto/blockchain tokens          | Massive complexity for simple token accounting                             | Stripe + database-tracked token balances     |

## Stack Patterns

**If adding frontend maps later:**

- Use Mapbox GL JS or Google Maps JavaScript API
- Because: better DX than Leaflet for interactive itinerary maps

**If OpenAI costs become prohibitive:**

- Consider Anthropic Claude for research agents (better at following complex instructions)
- Use GPT-3.5-turbo for validation/parsing (cheaper for structured output)
- Because: multi-model approach optimizes cost/quality per agent role

**If Tavily doesn't provide enough local content:**

- Add Reddit API for subreddit-specific searches (r/foodnyc, r/AskSF, etc.)
- Add curated RSS/blog feeds per region
- Because: local blogs and Reddit have the "culturally-aware friend" content that makes Swift Travel unique

## Sources

- OpenAI SDK documentation
- LangChain.js documentation
- Tavily API documentation
- Google Maps Platform pricing
- Stripe documentation (micropayments)
- Turf.js documentation

---

_Stack research for: AI travel concierge_
_Researched: 2026-03-03_

# External Integrations

**Analysis Date:** 2026-03-03

## APIs & External Services

**AI/LLM:**

- OpenAI API - Powers multi-agent system for itinerary generation
  - SDK/Client: `openai` 4.104.0
  - Auth: `OPENAI_API_KEY` environment variable
  - Used in: `packages/agents/src/research/index.ts`, `packages/agents/src/curation/index.ts`, `apps/functions/src/agents/*.ts`
  - Models: gpt-4, gpt-3.5-turbo (configurable via agents)

**Mapping & Location:**

- Google Places API - Destination and venue discovery
  - Auth: `GOOGLE_PLACES_API_KEY` environment variable
  - Status: Configured but not yet fully integrated
  - Planned for: Destination research and attraction discovery

- Google Maps API - Coordinate and navigation data
  - Auth: `GOOGLE_MAPS_API_KEY` environment variable
  - Status: Configured but not yet fully integrated
  - Planned for: Route planning and location context

**Error Tracking:**

- Sentry - Error tracking and performance monitoring
  - SDK: `@sentry/node` 7.0.0 (backend), `@sentry/nextjs` 7.0.0 (frontend)
  - Init: `packages/shared/src/utils/monitoring.ts` (initSentry function)
  - Auth: `SENTRY_DSN` environment variable
  - Features: Error capture, performance tracing (10% in prod, 100% in dev), breadcrumbs
  - Filtering: Strips authorization headers and cookies before sending

## Data Storage

**Databases:**

- Supabase PostgreSQL - Primary application database
  - Provider: Supabase Cloud
  - Client: `@supabase/supabase-js` 2.0.0
  - Connection:
    - `SUPABASE_URL` - Base URL
    - `SUPABASE_SERVICE_ROLE_KEY` - Server-side admin access
    - `SUPABASE_ANON_KEY` - Client-side public access
  - Location: `packages/database/src/client.ts`
  - Usage: User profiles, itineraries, travel preferences, session data
  - Type definitions: `packages/database/src/types/database.ts`

**Caching & Session Store:**

- Upstash Redis - Managed serverless Redis
  - Provider: Upstash Cloud
  - HTTP Client: `@upstash/redis` 1.35.3
  - Connection:
    - `UPSTASH_REDIS_URL` - REST endpoint URL
    - `UPSTASH_REDIS_TOKEN` - Authentication token
  - Location: `apps/functions/src/` (agents use @upstash/redis)
  - Purpose: Agent state coordination, request queuing, temporary caching

- Redis (Standard Client) - For development/local environments
  - Client: `redis` 4.6.0
  - Connection: `UPSTASH_REDIS_URL` and `UPSTASH_REDIS_TOKEN`
  - Location: `packages/shared/src/config/redis.ts`
  - TLS: Enabled for secure cloud connections
  - Session TTL: 24 hours
  - Manager classes:
    - `SessionManager` - User session storage
    - `AgentCoordinator` - Multi-agent state management
    - `CacheManager` - Response caching (15-min default TTL)

**File Storage:**

- Local filesystem only (no external file storage)

## Authentication & Identity

**Auth Provider:**

- Supabase Auth (custom implementation)
  - Implementation: Token-based with JWT
  - Location: `apps/functions/src/auth/` endpoints
  - Methods: Magic link (email), token verification
  - Token storage: Redis sessions + JWT
  - Secret: `JWT_SECRET` (minimum 64 characters)

**Internal Service Authentication:**

- X-Internal-Token header validation
  - Token: `INTERNAL_API_KEY` (minimum 64 characters)
  - Validation: `apps/functions/src/shared/auth.ts`
  - Used for: Agent-to-agent internal API calls
  - Middleware: `requireInternalAuth()` function

**JWT:**

- Library: `jsonwebtoken` 9.0.2
- Configuration: `packages/shared/src/config/auth.ts`
- Secret: `JWT_SECRET` environment variable

## Monitoring & Observability

**Error Tracking:**

- Sentry (see APIs & External Services above)
- Error capture: `captureError(error, context)` function
- Message capture: `captureMessage(message, level)` function
- Breadcrumbs: Automatic for agent pipeline stages
- Filtering: Authorization headers and cookies removed before sending

**Logs:**

- Pino 8.0.0 - Structured JSON logging
- Logger setup: `packages/shared/src/utils/logger.ts`
- Log levels: debug, info, warn, error
- Pretty printing: `pino-pretty` for development
- Usage: All packages log via centralized logger
- Agent-specific logger: `agentLogger` in `apps/functions/src/shared/logger.ts`

**Performance Monitoring:**

- PerformanceTimer class - Manual timing of operations
- AgentPipelineMonitor - Multi-stage operation tracking
- Sentry integration: Automatic breadcrumbs for monitored operations
- Metrics collection: `MetricsCollector` class (counter, gauge, histogram types)

**Health Checks:**

- Health check endpoint framework in `packages/shared/src/utils/monitoring.ts`
- Extensible pattern for database, Redis, and service health checks

## CI/CD & Deployment

**Hosting:**

- Netlify - Static hosting + serverless functions
  - Site URL: Configured via `netlify.toml`
  - Functions directory: `netlify-functions/` (bundled output)
  - Build command: `npm run build:web && npm run build:bundle --workspace=@swift-travel/functions`
  - Publish directory: `apps/web/out`

**CI Pipeline:**

- Not configured (manual or GitHub Actions/external CI implied)
- Local git hooks: Husky + lint-staged
  - Pre-commit: ESLint fix + Prettier format

**Functions Deployment:**

- Netlify Functions (serverless, Node.js 20)
- Build output: `.ts` files compiled to `.js` in `netlify-functions/`
- Bundler: ESBuild via `build.js` script
- Source maps: Generated (`.js.map` files)
- Endpoints:
  - `/api/auth/magic-link` - Magic link generation
  - `/api/auth/verify` - Token verification
  - `/api/auth/profile` - Get user profile
  - `/api/auth/logout` - Session cleanup
  - `/api/agents/research` - Research agent
  - `/api/agents/curation` - Curation agent
  - `/api/agents/response` - Response generation agent
  - `/api/agents/validation` - Validation agent
  - `/api/itineraries/process-request` - Process itinerary request

**Environment Management:**

- Development: `.env.local` (gitignored)
- Staging: Branch deploy environment
- Production: Main branch deploy environment
- Required env vars validated at startup in `packages/shared/src/config/validation.ts`

## Webhooks & Callbacks

**Incoming:**

- Magic link verification callback - Email link to verification endpoint
- None other currently implemented

**Outgoing:**

- None currently implemented
- Framework exists in email service for future provider integrations

## Email Service

**Current Implementation:**

- Development provider - Console logging only
- Location: `apps/functions/src/shared/email-service.ts`
- Templates: `apps/functions/src/shared/email-templates.ts`
- Magic link email generation: `generateMagicLinkEmail(data)` function

**Future Providers (Planned):**

- SendGrid (when `SENDGRID_API_KEY` added)
- Netlify Email (when `NETLIFY_EMAIL_TOKEN` added)
- Fallback and retry logic: 3 attempts with 1s delay between retries

## Security Headers

**Content Security Policy (CSP):**

- Default: `'self'`
- Scripts: `'self'`, `'unsafe-inline'`, `'unsafe-eval'`, `https://api.openai.com` (for external LLM)
- Connect: `'self'`, `https://*.supabase.co`, `https://api.openai.com`
- Styles: `'self'`, `'unsafe-inline'`
- Images: `'self'`, `data:`, `https:`
- Fonts: `'self'`, `data:`

**Other Headers:**

- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin

---

_Integration audit: 2026-03-03_

# Technology Stack

**Analysis Date:** 2026-03-03

## Languages

**Primary:**

- TypeScript 5.3.0 - All application code (frontend, backend, shared packages)
- JSX/TSX - React components in `apps/web`
- JavaScript - Build configuration and scripts

**Secondary:**

- HTML/CSS - Web assets
- TOML - Netlify configuration

## Runtime

**Environment:**

- Node.js 20.0.0 (minimum)
- npm 9.0.0 (minimum)
- Browser: Modern ES2022+ support

**Package Manager:**

- npm (workspaces enabled)
- Lockfile: `package-lock.json` (present)

## Frameworks

**Core Web:**

- Next.js 14.0.0 - Server-side rendering, API routes, static generation (`apps/web`)
- React 18.2.0 - UI components in `apps/web`
- Express 4.18.0 - Server framework for Netlify Functions (`apps/functions`)

**Styling:**

- Tailwind CSS 3.4.0 - Utility-first CSS framework (`apps/web`)
- PostCSS 8.4.24 - CSS processing with Autoprefixer

**State Management:**

- Zustand 4.4.0 - Lightweight state management (`apps/web`)
- Immer 10.1.3 - Immutable state updates (`apps/web`)

**UI Components:**

- Headless UI 1.7.0 - Unstyled, accessible components

**Testing:**

- Vitest 1.0.0 - Unit/integration testing (all workspaces)
- Playwright 1.40.0 - End-to-end testing (`apps/web`)
- Testing Library (React, Jest DOM) - Component testing utilities

**Build/Dev:**

- TypeScript 5.3.0 - Compilation and type checking
- ESBuild 0.25.10 - JavaScript bundler for Netlify Functions
- Netlify CLI 15.0.0 - Local development and deployment

## Key Dependencies

**Critical Infrastructure:**

- @supabase/supabase-js 2.0.0 - PostgreSQL database client (`packages/database`, `apps/functions`)
- Redis 4.6.0 - Session/cache client (`packages/shared`)
- @upstash/redis 1.35.3 - Upstash Redis HTTP client for serverless (`apps/functions`)
- ioredis 5.7.0 - Redis client with connection pooling (`apps/functions`)

**AI/ML:**

- openai 4.104.0 - OpenAI API client for agent system (`packages/agents`, `apps/functions`)

**Authentication:**

- jsonwebtoken 9.0.2 - JWT signing and verification (`apps/functions`)
- @types/jsonwebtoken 9.0.10 - TypeScript types for JWT

**Monitoring & Logging:**

- @sentry/node 7.0.0 - Error tracking and performance monitoring (`packages/shared`, `apps/functions`)
- @sentry/nextjs 7.0.0 - Sentry integration for Next.js (`apps/web`)
- pino 8.0.0 - Structured logging (`packages/shared`, `packages/agents`, `apps/functions`)
- pino-pretty 10.0.0 - Pretty printer for Pino logs (dev dependency)

**Validation & Data:**

- zod 3.22.0 - TypeScript-first schema validation (all packages)
- uuid 9.0.0 - UUID generation (`packages/shared`)

**Development Tools:**

- Prettier 3.0.0 - Code formatting
- ESLint 8.45.0 - Code linting with TypeScript support
- eslint-config-next 14.0.0 - Next.js ESLint config
- eslint-config-prettier 9.0.0 - Prettier integration
- Husky 8.0.3 - Git hooks
- lint-staged 13.2.3 - Run linters on staged files
- concurrently 8.2.0 - Run multiple commands in parallel

**Testing Utilities:**

- supertest 6.3.0 - HTTP assertion library for API testing
- @testing-library/react 13.4.0 - React component testing
- @testing-library/user-event 14.6.1 - User interaction simulation
- jsdom 23.0.0 - DOM implementation for Node.js

**AWS/Lambda:**

- @types/aws-lambda 8.10.152 - TypeScript types for AWS Lambda
- @netlify/functions 4.2.5 - Netlify Functions SDK

**Utilities:**

- @types/node 20.0.0 - TypeScript types for Node.js APIs
- @types/express 4.17.0 - TypeScript types for Express
- @types/react 18.2.0 - TypeScript types for React
- @types/react-dom 18.2.0 - TypeScript types for React DOM
- @types/uuid 9.0.0 - TypeScript types for UUID

## Configuration

**TypeScript:**

- Compiler target: ES2022
- Module format: esnext
- Module resolution: bundler
- Strict mode: enabled
- Base config: `tsconfig.json` (project root)
- Path aliases configured for monorepo packages: `@swift-travel/shared`, `@swift-travel/database`, `@swift-travel/agents`

**Linting:**

- ESLint config: `.eslintrc.json`
- Rules: TypeScript strict, no unused vars, prefer const, React warnings disabled in Next.js
- File-specific overrides for web (browser), functions (node), packages (node)

**Formatting:**

- Prettier config: `.prettierrc`
- Settings: 2-space indentation, trailing commas (es5), single quotes, 80-char print width

**Environment:**

- Build environment: NODE_VERSION = 20
- NODE_ENV support: development, staging, production
- Environment-specific scripts in `netlify.toml`

**Build Configuration:**

- Netlify build command: `npm run build:web && npm run build:bundle --workspace=@swift-travel/functions`
- Publish directory: `apps/web/out`
- Functions directory: `netlify-functions`

## Platform Requirements

**Development:**

- Node.js 20.0.0+
- npm 9.0.0+
- macOS, Linux, or WSL (Docker available via `Dockerfile.dev`)
- Git for version control and Husky hooks

**Production:**

- Netlify hosting (static site + serverless functions)
- Supabase PostgreSQL database
- Upstash Redis for session/cache
- OpenAI API access
- Sentry for error tracking (optional)

**Deployment Targets:**

- Frontend: Netlify Static Hosting (Next.js static export)
- Backend: Netlify Functions (serverless)
- Database: Supabase Cloud (PostgreSQL)
- Cache/Session: Upstash Redis (managed Redis)

## Docker Support

**Development:**

- Image: `node:20-alpine`
- Ports: 3000 (frontend), 8888 (functions)
- Installs dependencies via npm ci
- Builds shared packages before running dev server

---

_Stack analysis: 2026-03-03_

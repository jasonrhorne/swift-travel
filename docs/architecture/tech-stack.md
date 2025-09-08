# Tech Stack

This is the DEFINITIVE technology selection for the entire Swift Travel project. All development must use these exact versions and approaches, optimized for GitHub + Netlify deployment with function chaining architecture.

## Technology Stack Table

| Category | Technology | Version | Purpose | Rationale |
|----------|------------|---------|---------|-----------|
| Frontend Language | TypeScript | ^5.3.0 | Type-safe frontend development | Prevents runtime errors, enables shared interfaces with backend |
| Frontend Framework | Next.js | ^14.0.0 | React-based frontend with SSR | App Router for modern routing, built-in optimization, Netlify compatibility |
| UI Component Library | Tailwind CSS + Headless UI | ^3.4.0 + ^1.7.0 | Utility-first styling with accessible components | Rapid development, consistent design system, mobile-first responsive |
| State Management | Zustand | ^4.4.0 | Lightweight client state management | Simple API, TypeScript-first, minimal boilerplate for agent progress tracking |
| Backend Language | TypeScript | ^5.3.0 | Type-safe backend development | Shared types with frontend, better debugging, consistent development experience |
| Backend Framework | Node.js + Express | ^20.0.0 + ^4.18.0 | Serverless function runtime | Netlify Functions compatibility, familiar patterns, middleware support |
| API Style | REST + Server-Sent Events | HTTP/1.1 + SSE | RESTful APIs with real-time progress | Function chaining requires progress updates, SSE for agent status streaming |
| Database | Supabase PostgreSQL | Latest | Primary data store with auth | Managed PostgreSQL, built-in auth, real-time subscriptions, automatic API generation |
| Cache | Redis (Upstash) | ^7.0 | Agent state coordination and caching | Serverless Redis for function chaining state, API response caching, session storage |
| File Storage | Supabase Storage | Latest | PDF exports and user uploads | S3-compatible storage integrated with auth, automatic CDN distribution |
| Authentication | Supabase Auth (Magic Links) | Latest | Passwordless user authentication | Frictionless auth experience, secure token management, built-in session handling |
| Frontend Testing | Vitest + React Testing Library | ^1.0.0 + ^13.4.0 | Unit and component testing | Fast test execution, Jest-compatible API, better TypeScript support |
| Backend Testing | Vitest + Supertest | ^1.0.0 + ^6.3.0 | API and integration testing | Consistent testing framework, function chaining workflow testing |
| E2E Testing | Playwright | ^1.40.0 | End-to-end user journey testing | Multi-agent pipeline validation, cross-browser testing, visual regression |
| Build Tool | Vite | ^5.0.0 | Fast development and production builds | Lightning-fast HMR, optimized bundling, TypeScript-first approach |
| Bundler | Rollup (via Vite) | ^4.0.0 | Production code bundling | Tree-shaking optimization, code splitting, Netlify deployment optimization |
| IaC Tool | Netlify Config | netlify.toml | Infrastructure as code for deployment | Git-based infrastructure management, preview deployments, environment configuration |
| CI/CD | GitHub Actions + Netlify | Latest | Automated testing and deployment | GitHub integration, branch previews, automated quality gates |
| Monitoring | Sentry + Netlify Analytics | ^7.0.0 + Built-in | Error tracking and performance monitoring | Agent pipeline error tracking, function performance monitoring, user analytics |
| Logging | Pino + Netlify Functions Logs | ^8.0.0 + Built-in | Structured logging across agents | JSON logging for agent coordination, built-in Netlify function logs |
| CSS Framework | Tailwind CSS | ^3.4.0 | Utility-first CSS framework | Mobile-first responsive design, design system consistency, small bundle size |

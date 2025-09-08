# Coding Standards

## Critical Fullstack Rules

- **Type Sharing:** Always define types in `packages/shared/src/types` and import from there - never duplicate interfaces
- **API Calls:** Never make direct HTTP calls - use the service layer in `apps/web/src/lib/api` with proper error handling
- **Environment Variables:** Access only through config objects in `packages/shared/src/config`, never process.env directly
- **Error Handling:** All Netlify Functions must use the standard error handler with structured logging and user-friendly messages
- **State Updates:** Never mutate state directly - use proper Zustand patterns with immer for complex objects
- **Agent Communication:** Internal agent calls must use the X-Internal-Token header for security
- **Database Access:** Always use the Data Access Layer - never import Supabase client directly in components
- **Async Operations:** All agent functions must update Redis state before triggering next agent in chain

## Naming Conventions

| Element | Frontend | Backend | Example |
|---------|----------|---------|---------|
| Components | PascalCase | - | `ItineraryCard.tsx` |
| Hooks | camelCase with 'use' | - | `useAgentProgress.ts` |
| API Routes | - | kebab-case | `/agents/research-agent` |
| Database Tables | - | snake_case | `itinerary_requests` |
| Netlify Functions | - | kebab-case | `create-itinerary.ts` |

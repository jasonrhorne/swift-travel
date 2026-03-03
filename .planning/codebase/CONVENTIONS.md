# Coding Conventions

**Analysis Date:** 2026-03-03

## Naming Patterns

**Files:**

- Components: PascalCase (e.g., `RequirementsIntakeForm.tsx`, `LoginPage.tsx`)
- Utilities and helpers: camelCase (e.g., `validateSession.ts`, `emailService.ts`)
- Hooks: camelCase with `use` prefix (e.g., `usePerformanceMetrics.ts`)
- Tests: Match source file with `.test.ts` or `.spec.ts` suffix (e.g., `auth.test.ts`, `itinerary.spec.ts`)
- Constants: UPPERCASE_SNAKE_CASE when exported from modules

**Functions:**

- camelCase for all function names
- Async operations follow verb conventions: `request*`, `verify*`, `validate*`, `get*`, `fetch*`, `handle*`
- Private functions begin with underscore when appropriate (e.g., `_isTokenRevoked`)

**Variables:**

- camelCase for all variables and constants
- Boolean variables prefixed with `is` or `has` (e.g., `isAuthenticated`, `hasError`)
- State variables in Zustand stores use camelCase without prefix

**Types:**

- PascalCase for interfaces and types (e.g., `UserRequirements`, `AuthContext`, `ValidationResult`)
- Union types are PascalCase enumerations (e.g., `ProcessingStatus`, `ActivityCategory`)
- Type definitions placed immediately before usage or in dedicated `types/` directories

**Directories:**

- Lowercase with hyphens for multi-word names (e.g., `__tests__`, `auth-middleware.ts`)
- Component directories use PascalCase to match component names
- Utility directories use lowercase (e.g., `shared/`, `utils/`)

## Code Style

**Formatting:**

- Tool: Prettier with configuration in `.prettierrc`
- Tab width: 2 spaces
- Line length: 80 characters
- Semicolons: Required (semi: true)
- Single quotes: Enforced (singleQuote: true)
- Trailing commas: ES5 style (trailingComma: 'es5')
- Arrow parentheses: Avoid when possible (arrowParens: 'avoid')

**Linting:**

- Tool: ESLint with TypeScript support
- Configuration: `.eslintrc.json`
- Critical rules enforced:
  - `@typescript-eslint/no-unused-vars`: Error
  - `@typescript-eslint/no-explicit-any`: Warning (use typed alternatives)
  - `prefer-const`: Error
  - `no-console`: Warning in functions, discourage logging in production code
- Run linting: `npm run lint`
- Format with Prettier: `npm run format`

## Import Organization

**Order:**

1. External libraries (react, next, zod, etc.)
2. Internal packages (@swift-travel/shared, @swift-travel/database)
3. Local aliases (@/, components, stores)
4. Relative imports for same directory (../types, ./helpers)
5. Side-effect imports (at top if needed)

**Path Aliases:**

- `@/` → `apps/web/src/` (web app only)
- `@swift-travel/shared` → `packages/shared/src`
- `@swift-travel/database` → `packages/database/src`
- `@swift-travel/agents` → `packages/agents/src`

**Barrel Files:**

- Used in `packages/shared/src/` for grouping exports
- Example: `packages/shared/src/index.ts` re-exports all public types
- Avoid circular dependencies through barrel files

## Error Handling

**Patterns:**

- Custom error class: `AppError` extends Error with code, statusCode, and details
  - Location: `packages/shared/src/utils/index.ts`
  - Usage: `new AppError(message, code, statusCode, details)`
- API errors: Custom `AuthApiError` class for authentication failures
  - Caught with `instanceof AuthApiError` checks
  - Messages extracted before re-throwing
- Function errors: Wrapped in try-catch with specific error type checks
  - Example: Check `error instanceof Error` before accessing message
  - Fall back to 'Unknown error' for edge cases
- Never expose internal errors to users; use generic messages and log details

**Error Response Format:**

```typescript
{
  success: boolean;
  error?: string;        // Error code
  message?: string;      // User-facing message
  data?: any;           // Additional context
  statusCode?: number;  // HTTP status
}
```

## Logging

**Framework:** Pino for backend/functions, console for client code

**Patterns:**

- Backend functions use pino logger initialization at file top:
  ```typescript
  import pino from 'pino';
  const logger = pino({ name: 'module-name', level: 'info' });
  ```
- Log levels: `info`, `warn`, `error`, `debug`
- Critical info logged: request IDs, user actions, validation failures, API calls
- Sensitive data (passwords, tokens): Log only truncated versions or hashes
- Console methods used sparingly in client code:
  - `console.info()` for session/auth info
  - `console.warn()` for non-critical errors
  - `console.error()` for critical failures (rare)

## Comments

**When to Comment:**

- Complex algorithms or non-obvious logic
- Business rule explanations that aren't clear from code
- Workarounds for bugs or limitations
- Integration points with external services
- TODO/FIXME for planned improvements (should include context)

**JSDoc/TSDoc:**

- Used for public API functions and exported utilities
- Format:
  ```typescript
  /**
   * Validates email address format
   * @param email - Email string to validate
   * @returns Boolean indicating if email is valid
   */
  export const isValidEmail = (email: string): boolean => { ... }
  ```
- Inline comments use `//` for single-line explanations
- Block comments `/** */` only for function/type documentation

## Function Design

**Size:** Aim for 20-50 lines per function; extract complex logic into helpers

**Parameters:**

- Maximum 3 parameters; use object parameter for related values
- Example: `function createUser(name: string, email: string, preferences: UserPreferences)`
- Provide defaults where sensible for optional parameters

**Return Values:**

- Functions return either data or Error objects, not null for failures
- Use Result type pattern for operations that can fail:
  ```typescript
  type Result<T> =
    | { success: true; data: T }
    | { success: false; error: string };
  ```
- Async functions always return Promise-wrapped results

**Naming Convention for Operations:**

- Data fetching: `get*()`, `fetch*()`, `retrieve*()`
- State modification: `set*()`, `update*()`, `add*()`, `remove*()`
- Validation: `validate*()`, `is*()`, `check*()`
- Transformation: `format*()`, `parse*()`, `serialize*()`, `deserialize*()`

## Module Design

**Exports:**

- Prefer named exports over default exports
- Group related exports: types, interfaces, functions, utilities
- Use index.ts files for package-level exports in monorepo packages

**Barrel Files:**

- Example: `packages/shared/src/index.ts` exports all public APIs
- Helps maintain consistent import paths across codebase
- Update when adding new public exports

**File Structure:**

- One primary export per file (unless tightly coupled utilities)
- Supporting types defined in same file or `types/` subdirectory
- Tests colocated with source: `src/module.ts` paired with `src/__tests__/module.test.ts`

## State Management

**Zustand Pattern (Frontend):**

- Store definition with immer middleware for nested object updates
- State split into sections: state variables, derived state, actions
- Actions use `set(state => { ... })` with immer for immutable updates
- Example location: `apps/web/src/stores/requirementsStore.ts`
- Persistence via `persist` middleware with selective hydration

**Backend State:**

- Redis for caching and temporary state (sessions, tokens)
- Key naming: `prefix:identifier` (e.g., `magic_token:abc123`)
- Expiration set on all temporary data
- Supabase for persistent relational data

## Type Safety

**TypeScript Strict Mode:** Enabled across all projects

- No implicit `any`
- Strict null checks
- All function parameters typed
- All return types explicitly specified (no implicit any)

**Generic Types:**

- Used for reusable components and utilities
- Example: `Result<T>`, `Paginated<T>`, `ApiResponse<T>`
- Type parameters follow naming: single letters for simple cases (T, K), descriptive for complex (TItem, TResponse)

## Code Organization by Layer

**Frontend (apps/web/src):**

- `app/` - Next.js App Router pages
- `components/` - React components (UI, forms, layout)
- `stores/` - Zustand state management
- `lib/api/` - API client functions
- `__tests__/` - Test files (colocated with source)

**Backend/Functions (apps/functions/src):**

- `auth/` - Authentication handlers
- `agents/` - Agent pipeline handlers (research, curation, validation, response)
- `itineraries/` - Itinerary processing handlers
- `shared/` - Middleware, utilities, services
- `__tests__/` - Test files

**Shared Packages (packages/\*):**

- `src/types/` - Type definitions
- `src/config/` - Configuration loading
- `src/validation/` - Zod schemas and validation
- `src/utils/` - Utility functions
- `src/constants/` - Constant values

---

_Convention analysis: 2026-03-03_

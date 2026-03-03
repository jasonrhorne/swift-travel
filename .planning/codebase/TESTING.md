# Testing Patterns

**Analysis Date:** 2026-03-03

## Test Framework

**Runner:**

- Vitest 1.0.0
- Config files:
  - Root: `vitest.config.ts` (node environment, globals enabled)
  - Web app: `apps/web/vitest.config.ts` (jsdom environment, React support)
- Environment setup via setupFiles in web config

**Assertion Library:**

- Vitest built-in assertions (expect)
- @testing-library/jest-dom for DOM matchers
- Additional matchers: `.toBeInTheDocument()`, `.toBeDisabled()`, etc.

**Run Commands:**

```bash
npm run test:unit           # Run all tests with Vitest
npm run test                # Run all tests in all workspaces
npm run test:functions      # Run function-specific tests
npm test -- --watch        # Watch mode (requires from workspace)
npm test -- --coverage     # Generate coverage report
```

## Test File Organization

**Location:**

- Colocated with source code in `__tests__/` subdirectory
- Mirrors source structure: `src/module.ts` → `src/__tests__/module.test.ts`
- Fixtures/test data in `__tests__/fixtures/` when shared across tests

**Naming:**

- Test files: `*.test.ts` for unit/integration, `*.spec.ts` for e2e
- Describe blocks: Use noun phrases describing what is tested
- Test cases: Use "should..." verbs describing expected behavior

**Directory Structure:**

```
src/
├── components/
│   ├── Form.tsx
│   └── __tests__/
│       └── Form.test.tsx
├── stores/
│   ├── auth.ts
│   └── __tests__/
│       └── auth.test.ts
└── lib/
    ├── api/
    │   ├── auth.ts
    │   └── __tests__/
    │       └── auth.test.ts
```

## Test Structure

**Suite Organization:**

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('ModuleName', () => {
  // Setup
  beforeEach(() => {
    // Reset state before each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  describe('Feature/Function', () => {
    it('should behave correctly in condition', () => {
      // Arrange - set up test data
      // Act - perform action
      // Assert - verify results
    });
  });
});
```

**Patterns:**

- Reset store state in `beforeEach()` using reset functions
- Clear all mocks via `vi.clearAllMocks()` in `beforeEach()`
- Use nested `describe()` blocks to organize related tests
- One assertion per test when possible (arrange-act-assert pattern)

## Mocking

**Framework:** Vitest's `vi` object

**Patterns:**

### Module Mocking:

```typescript
vi.mock('../path/to/module', () => ({
  functionName: vi.fn(),
  export: vi.fn(),
}));
```

### Store Mocking (Zustand):

```typescript
vi.mock('../stores/auth', () => ({
  useAuthStore: vi.fn(),
}));

// In test setup
const mockStore = {
  /* state and actions */
};
vi.mocked(useAuthStore).mockReturnValue(mockStore);
```

### API Mocking:

```typescript
vi.mock('../lib/api/auth', () => ({
  requestMagicLink: vi.fn(),
  verifyToken: vi.fn(),
}));

// Configure mock behavior
vi.mocked(requestMagicLink).mockResolvedValue({ success: true });
vi.mocked(verifyToken).mockRejectedValue(new Error('Invalid token'));
```

### Return Value Configuration:

```typescript
// Single return value
vi.fn().mockReturnValue('value');
vi.fn().mockResolvedValue({ data: 'result' });
vi.fn().mockRejectedValue(new Error('failed'));

// Multiple sequential calls
vi.fn()
  .mockResolvedValueOnce(firstValue)
  .mockResolvedValueOnce(secondValue)
  .mockRejectedValueOnce(error);
```

**What to Mock:**

- External services (API calls, email services, Redis)
- Zustand stores in component tests
- Next.js router and navigation
- File system operations
- Date/time functions (optional, for time-dependent logic)

**What NOT to Mock:**

- Validation schemas (Zod) - test actual validation
- Utility functions - test real behavior
- Error classes and types
- Constants and type definitions
- Business logic (unless testing integration with mocks)

## Fixtures and Factories

**Test Data Patterns:**

### Direct Fixture Objects:

```typescript
const validRequirements = {
  destination: 'Paris, France',
  interests: ['Photography', 'Food'],
  duration: 'long-weekend' as const,
  groupSize: 2,
  specialRequests: ['Anniversary dinner'],
  accessibilityNeeds: ['Wheelchair accessible venues'],
};
```

### Mock Request/Response Objects:

```typescript
const mockItineraryRequest: ItineraryRequest = {
  id: 'test-request-id',
  userId: 'test-user',
  requirements: validRequirements,
  status: 'research-in-progress' as ProcessingStatus,
  // ... other required fields
};
```

### Factory Functions:

```typescript
const createMockUser = (overrides?: Partial<User>): User => ({
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  // ... defaults
  ...overrides,
});
```

**Location:**

- Fixtures defined at top of test file or in `__tests__/fixtures/` directory
- Shared fixtures across multiple tests: `__tests__/fixtures/user.fixtures.ts`
- Reset/refresh fixtures in `beforeEach()` to ensure test isolation

## Coverage

**Requirements:** No formal coverage target enforced currently

**View Coverage:**

```bash
npm test -- --coverage
```

**Coverage reporting:**

- Generated in coverage/ directory
- HTML report available in coverage/index.html
- Use for identifying untested code paths
- Focus on critical paths: auth, data processing, error handling

## Test Types

**Unit Tests:**

- Scope: Single function or component in isolation
- Approach: Mock all external dependencies
- Example: `requirementsStore.test.ts` tests store actions independently
- File pattern: `src/**/__tests__/**/*.test.ts`

**Integration Tests:**

- Scope: Multiple components/functions working together
- Approach: Mock external services (API, database) but test real component interaction
- Example: `agent-pipeline.test.ts` tests full pipeline with mocked Redis/Supabase
- Distinction: Test data flow between modules, not individual modules

**E2E Tests:**

- Scope: Full user workflows from UI to backend
- Framework: Playwright 1.40.0 (configured in `e2e/` directory)
- Examples: `e2e/specs/auth.spec.ts`, `e2e/specs/itinerary.spec.ts`
- Run with: `npm run test:e2e`
- Real browser, real API calls (to test environment)

## Common Patterns

**Async Testing:**

```typescript
// Promise-based async
it('should handle async operations', async () => {
  const result = await asyncFunction();
  expect(result).toBe(expected);
});

// Using waitFor for state changes
import { waitFor } from '@testing-library/react';

it('should update state after action', async () => {
  render(<Component />);
  fireEvent.click(screen.getByRole('button'));

  await waitFor(() => {
    expect(screen.getByText('Updated')).toBeInTheDocument();
  });
});

// Using vi.waitFor for store/state updates
await vi.waitFor(() => {
  const state = useStore.getState();
  expect(state.isLoading).toBe(false);
});
```

**Error Testing:**

```typescript
// Expect thrown errors
it('should throw on invalid input', () => {
  expect(() => {
    validateSchema.parse(invalidData);
  }).toThrow();
});

// Expect rejected promises
it('should reject on API error', async () => {
  vi.mocked(apiCall).mockRejectedValue(new Error('API failed'));

  await expect(functionUsingApi()).rejects.toThrow('API failed');
});

// Test error handling
it('should handle errors gracefully', async () => {
  const { getState, setState } = useStore;

  try {
    await errorProneOperation();
  } catch (error) {
    setState({ error: error.message });
  }

  expect(getState().error).toBe(expectedMessage);
});
```

**Component Testing (React Testing Library):**

```typescript
import { render, screen, fireEvent } from '@testing-library/react';

it('should render and respond to user interactions', () => {
  render(<LoginForm />);

  // Query by user-visible labels (best practice)
  const emailInput = screen.getByLabelText(/email/i);
  const button = screen.getByRole('button', { name: /submit/i });

  // Interact with component
  fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
  fireEvent.click(button);

  // Assert on results
  expect(screen.getByText(/success/i)).toBeInTheDocument();
});
```

**Store Testing (Zustand):**

```typescript
it('should update state correctly', () => {
  const { getState, setState } = useAuthStore;

  // Reset before test
  getState().reset?.();

  // Get initial state
  expect(getState().isAuthenticated).toBe(false);

  // Call action
  getState().login('test@example.com');

  // Verify state changed
  const state = getState();
  expect(state.isAuthenticated).toBe(true);
  expect(state.user?.email).toBe('test@example.com');
});
```

**Validation Testing (Zod):**

```typescript
it('should validate correct data', () => {
  const schema = userRequirementsSchema;
  expect(() => schema.parse(validData)).not.toThrow();
});

it('should reject invalid data', () => {
  const schema = userRequirementsSchema;
  expect(() => schema.parse(invalidData)).toThrow(z.ZodError);
});

it('should format validation errors', () => {
  try {
    schema.parse(invalidData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formatted = formatValidationError(error);
      expect(formatted).toHaveProperty('destination');
    }
  }
});
```

**Mock Verification:**

```typescript
it('should call API with correct parameters', async () => {
  const mockFn = vi.fn().mockResolvedValue({ success: true });

  await functionUsingApi();

  // Verify call was made
  expect(mockFn).toHaveBeenCalled();

  // Verify specific arguments
  expect(mockFn).toHaveBeenCalledWith('expected-arg', { option: true });

  // Verify call count
  expect(mockFn).toHaveBeenCalledTimes(1);

  // Verify last call
  expect(mockFn).toHaveBeenLastCalledWith('final-arg');
});
```

## Test Setup and Global Configuration

**Web App Setup (`apps/web/src/__tests__/setup.ts`):**

```typescript
// Testing library setup
import '@testing-library/jest-dom';

// Mock Next.js router
vi.mock('next/router', () => ({ ... }));
vi.mock('next/navigation', () => ({ ... }));

// Mock browser APIs
Object.defineProperty(window, 'localStorage', { ... });
Object.defineProperty(window, 'sessionStorage', { ... });
global.IntersectionObserver = vi.fn();
global.ResizeObserver = vi.fn();
global.fetch = vi.fn();
```

**Globals Configuration:**

- `vitest.config.ts` sets `test.globals = true` - import `describe`, `it`, `expect` globally
- No need for explicit imports in test files

## Best Practices

1. **Test Behavior, Not Implementation:**
   - Test what user sees/does, not internal code structure
   - Focus on inputs and outputs

2. **Use Descriptive Test Names:**
   - "should..." format makes test failures self-documenting
   - Example: `it('should disable submit button while loading')`

3. **Isolate Tests:**
   - Reset state before each test
   - Clear all mocks before each test
   - Don't rely on test execution order

4. **Keep Tests Fast:**
   - Mock slow operations (API calls, file I/O)
   - Use in-memory databases for tests when possible

5. **Test Edge Cases:**
   - Empty inputs, null values, boundary conditions
   - Error conditions and fallback paths

6. **Avoid Test Duplication:**
   - Use parameterized tests for similar cases
   - Extract common setup into helper functions

---

_Testing analysis: 2026-03-03_

# CI/CD Pipeline Fix Plan - 2025-09-17

## Current Status
- **Last Failed Run**: #17815772900 (CI/CD Pipeline) & #17815772901 (Security Checks)
- **Commit**: Complete Story 1.5: Simple Itinerary Generation & Display
- **Date**: 2025-09-18T02:05:11Z

## Issues Summary

### 1. TypeScript Errors (10 occurrences)
**Error**: "Expected 1 arguments, but got 2"
- `apps/functions/src/__tests__/agents/research.test.ts`: Lines 147, 175, 197, 234, 263
- `apps/functions/src/__tests__/agents/curation.test.ts`: Lines 179, 219, 269, 330, 352

### 2. Linting Errors (10 errors, 9 warnings)
**Unused Variables/Imports**:
- `apps/functions/src/shared/email-service.ts:70` - 'SendGridProvider' defined but never used
- `apps/functions/src/shared/email-service.ts:58` - 'template' defined but never used
- `apps/functions/src/shared/email-service.ts:55` - 'NetlifyEmailProvider' defined but never used
- `apps/functions/src/itineraries/process-request.ts:30` - 'context' defined but never used
- `apps/functions/src/itineraries/process-request.ts:14` - 'validateInternalAuth' defined but never used
- `apps/functions/src/auth/verify.ts:9` - 'VerifyTokenRequest' defined but never used
- `apps/functions/src/auth/magic-link.ts:17` - 'supabase' assigned but never used
- `apps/functions/src/auth/magic-link.ts:8` - 'MagicLinkRequest' defined but never used
- `apps/functions/src/agents/validation.ts:68` - 'context' defined but never used
- `apps/functions/src/agents/validation.ts:8` - 'ItineraryRequest' defined but never used

**Type Warnings** (Unexpected any):
- `apps/functions/src/__tests__/agents/research.test.ts`: Lines 129, 144
- `apps/functions/src/__tests__/agents/curation.test.ts`: Lines 62, 161, 176, 216, 251, 266, 312, 327

### 3. Test Failures
**Assertion Errors**:
- `response.test.ts:280` - Expected 400, got 500
- `response.test.ts:226` - TypeError: vi.mocked(...).mockReturnValue is not a function
- `research.test.ts:266` - Expected 404, got 500
- `research.test.ts:150` - Expected 200, got 500
- `curation.test.ts:335` - Error message mismatch: 'Curation processing failed' vs 'Error processing curation request'
- `curation.test.ts:274` - Error message mismatch: 'Curation processing failed' vs 'Error processing curation request'
- `curation.test.ts:222` - Expected 400, got 500
- `curation.test.ts:182` - Expected 200, got 500

**Playwright Errors**:
- `e2e/specs/itinerary.spec.ts:3` - test.describe() called in wrong context
- `e2e/specs/auth.spec.ts:3` - test.describe() called in wrong context

### 4. Security Check Failures
- CodeQL Action v2 deprecated - needs upgrade to v3
- Dependency check failing with exit code 1

## Fix Plan

### Phase 1: TypeScript & Mocking Issues
1. **Fix function signature mismatches**
   - Review and correct all function calls with wrong argument counts
   - Update mock implementations to match actual function signatures

2. **Fix vi.mocked() issues**
   - Correct mock setup syntax in response.test.ts
   - Ensure proper vitest mock configuration

### Phase 2: Clean Up Linting Issues
3. **Remove unused imports**
   - Clean up all unused imports across 7 files
   - Verify no side effects from removed imports

4. **Fix type warnings**
   - Replace all `any` types with proper TypeScript types
   - Add appropriate type definitions for test data

### Phase 3: Fix Test Failures
5. **Correct status code expectations**
   - Update test assertions to match actual API responses
   - Review error handling logic in source files

6. **Fix error message assertions**
   - Update expected error messages in curation tests
   - Ensure consistency between implementation and tests

### Phase 4: E2E Configuration
7. **Fix Playwright setup**
   - Review playwright.config.ts
   - Correct test file imports and structure
   - Ensure proper test runner configuration

### Phase 5: Security Updates
8. **Update GitHub Actions**
   - Upgrade CodeQL action from v2 to v3
   - Review and fix dependency vulnerabilities

### Phase 6: Verification
9. **Local testing sequence**
   ```bash
   npm run typecheck
   npm run lint
   npm test
   npm run build
   ```

## Success Criteria
- [ ] All TypeScript errors resolved
- [ ] Zero lint errors (warnings acceptable)
- [ ] All unit tests passing
- [ ] E2E tests executable
- [ ] Security checks passing
- [ ] CI/CD pipeline green

## Rollback Plan
If issues persist after fixes:
1. Revert to commit 41cec2b (last partially working state)
2. Apply fixes incrementally with separate commits
3. Test each fix category independently

## Commands for Quick Reference
```bash
# Check specific test file
npm test -- apps/functions/src/__tests__/agents/research.test.ts

# Run typecheck for functions only
npm run typecheck --workspace=@swift-travel/functions

# Check lint for specific file
npx eslint apps/functions/src/shared/email-service.ts

# View detailed CI logs
gh run view 17815772900 --log-failed
```

## Notes
- Multiple test files showing similar patterns suggest systematic issue with mock setup
- Status code mismatches (500 vs expected) indicate error handling changes
- Playwright issues may be related to recent package updates or config changes
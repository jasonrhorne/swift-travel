# Testing Strategy

## Testing Pyramid

```
       E2E Tests (User Journeys)
      /                        \
     Integration Tests (API + Agent Pipeline)
    /                                        \
   Frontend Unit Tests        Backend Unit Tests
```

## Test Organization

**Frontend Tests:**
```
apps/web/src/
├── __tests__/
│   ├── components/           # Component unit tests
│   ├── hooks/                # Custom hook tests
│   ├── pages/                # Page integration tests
│   └── utils/                # Utility function tests
├── e2e/
│   ├── auth.spec.ts          # Authentication flow
│   ├── itinerary.spec.ts     # Full itinerary generation
│   └── sharing.spec.ts       # PDF export and sharing
```

**Backend Tests:**
```
apps/functions/src/
├── __tests__/
│   ├── agents/               # Individual agent tests
│   ├── auth/                 # Authentication tests
│   ├── itineraries/          # CRUD operation tests
│   └── integration/          # Full pipeline tests
```

**E2E Tests:**
```
e2e/
├── specs/
│   ├── user-journey.spec.ts  # Complete user flow
│   ├── agent-pipeline.spec.ts # Multi-agent coordination
│   └── error-scenarios.spec.ts # Error handling and recovery
```

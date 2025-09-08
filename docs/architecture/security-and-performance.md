# Security and Performance

## Security Requirements

**Frontend Security:**
- CSP Headers: `default-src 'self'; script-src 'self' 'unsafe-inline'; connect-src 'self' https://api.openai.com https://*.supabase.co`
- XSS Prevention: Content sanitization for all user inputs, Next.js built-in protections
- Secure Storage: HTTP-only cookies for session tokens, localStorage for non-sensitive preferences

**Backend Security:**
- Input Validation: Zod schema validation for all API inputs and agent data
- Rate Limiting: 10 requests/minute per user for itinerary generation, 100/minute for other endpoints
- CORS Policy: Restrict to frontend domains only, credentials included for auth endpoints

**Authentication Security:**
- Token Storage: JWT in HTTP-only cookies, refresh tokens in secure storage
- Session Management: 24-hour token expiry with automatic refresh, secure session invalidation
- Password Policy: N/A (magic link only), strong token generation with crypto.randomBytes

## Performance Optimization

**Frontend Performance:**
- Bundle Size Target: <500KB initial bundle, <100KB per route
- Loading Strategy: Route-based code splitting, progressive component loading, SSR for SEO
- Caching Strategy: Next.js automatic static optimization, service worker for offline support

**Backend Performance:**
- Response Time Target: <2 seconds per agent function, <20 seconds total pipeline
- Database Optimization: Proper indexing, connection pooling, query optimization for complex JSON
- Caching Strategy: Redis for agent state (1-hour TTL), API response caching (15-minute TTL)

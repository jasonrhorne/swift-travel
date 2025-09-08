# Technical Assumptions

## Repository Structure: Monorepo
Single repository containing all Swift-travel components (web app, API, multi-agent orchestration, shared utilities) to enable rapid iteration and coordinated deployment during MVP phase. This supports the <20 second processing requirement by minimizing inter-service latency while maintaining clear separation of concerns within the monorepo structure.

## Service Architecture
**Multi-Agent Orchestration within Monolithic API**: Deploy Cardinal's validated four-agent system (Research, Curation, Validation, Response) as coordinated modules within a single API service. This architectural choice balances multi-agent coordination benefits with MVP deployment simplicity, avoiding microservices complexity while maintaining agent specialization. The monolithic approach ensures sub-20-second processing times and simplified error handling during early scaling.

## Testing Requirements
**Unit + Integration Testing with Multi-Agent Validation**: Comprehensive testing pyramid including unit tests for individual agent logic, integration tests for agent coordination workflows, and end-to-end tests for complete user journeys. Special emphasis on testing multi-agent handoffs, external API integration (Google Places/Maps), and hallucination detection. Testing framework must support async agent coordination patterns and mock external API responses for reliable CI/CD pipelines.

## Additional Technical Assumptions and Requests

**Programming Language & Framework**: 
- **Backend**: Node.js with TypeScript for rapid development, strong async support for multi-agent coordination, and seamless LLM API integration
- **Frontend**: React with Next.js for mobile-responsive web experience, server-side rendering for SEO, and static export capabilities for PDF generation

**LLM Integration Strategy**: 
- Primary: OpenAI GPT-4 for agent coordination with fallback to Anthropic Claude for validation cross-checking
- Cost management through intelligent prompt optimization and response caching
- Agent-specific model selection (lighter models for validation, premium models for curation)

**External API Integration**:
- Google Places API for location validation and details
- Google Maps API for travel time calculation and neighborhood clustering
- Implement proper rate limiting, caching, and error handling to meet 99.5% uptime requirement

**Data Storage**:
- PostgreSQL for structured user data, itinerary storage, and audit trails
- Redis for session management, API response caching, and real-time agent coordination state

**Authentication & Security**:
- Magic link authentication with JWT tokens for stateless session management
- API key management for external services with proper rotation and monitoring
- Input sanitization and rate limiting to prevent abuse

**Deployment & Infrastructure**:
- Docker containerization for consistent deployment across environments
- CI/CD pipeline supporting rapid iteration while maintaining quality gates
- Cloud deployment (preferably AWS/Vercel) with auto-scaling for peak travel planning periods

**Monitoring & Analytics**:
- Application performance monitoring for multi-agent processing times
- User behavior analytics for conversion funnel optimization
- Error tracking and alerting for agent coordination failures
- Cost monitoring for LLM API usage against revenue targets

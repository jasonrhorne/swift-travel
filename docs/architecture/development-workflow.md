# Development Workflow

## Local Development Setup

```bash
# Prerequisites
node --version  # v20+
npm --version   # v9+
git --version   # v2.30+

# Clone and setup
git clone https://github.com/[username]/swift-travel.git
cd swift-travel
npm install
```

## Initial Setup

```bash
# Environment setup
cp .env.example .env.local
# Edit .env.local with your API keys and database URLs

# Database setup
npm run db:migrate
npm run db:seed

# Install Netlify CLI for local functions
npm install -g netlify-cli
netlify login
```

## Development Commands

```bash
# Start all services (frontend + functions)
npm run dev

# Start frontend only
npm run dev:web

# Start functions only  
npm run dev:functions

# Run tests
npm run test           # All tests
npm run test:unit      # Unit tests
npm run test:e2e       # E2E tests
npm run test:functions # Function tests

# Build and deploy
npm run build          # Production build
npm run deploy:preview # Deploy preview
npm run deploy:prod    # Deploy production
```

## Environment Configuration

```bash
# Frontend (.env.local)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_BASE_URL=http://localhost:8888/.netlify/functions

# Functions (.env)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_key
GOOGLE_PLACES_API_KEY=your_google_places_key
GOOGLE_MAPS_API_KEY=your_google_maps_key
UPSTASH_REDIS_URL=your_redis_url
UPSTASH_REDIS_TOKEN=your_redis_token
INTERNAL_API_KEY=your_internal_agent_key

# Shared
DATABASE_URL=your_supabase_db_url
JWT_SECRET=your_jwt_secret
ENVIRONMENT=development
```

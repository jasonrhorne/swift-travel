# Unified Project Structure

Monorepo structure optimized for GitHub + Netlify deployment with function chaining architecture:

```
swift-travel/
├── .github/                    # GitHub workflows and templates
│   └── workflows/
│       ├── ci.yml             # Test, lint, type-check pipeline
│       └── deploy.yml         # Netlify deployment workflow
├── .netlify/                  # Netlify configuration
│   └── functions/             # Netlify Functions (auto-deployed)
├── apps/                      # Application packages
│   ├── web/                   # Frontend Next.js application
│   │   ├── src/
│   │   │   ├── app/           # Next.js 14 App Router
│   │   │   │   ├── (auth)/    # Auth route groups
│   │   │   │   ├── dashboard/ # User dashboard
│   │   │   │   └── itinerary/ # Itinerary views
│   │   │   ├── components/    # React components
│   │   │   │   ├── ui/        # Reusable UI components
│   │   │   │   ├── forms/     # Form components
│   │   │   │   └── itinerary/ # Itinerary-specific components
│   │   │   ├── hooks/         # Custom React hooks
│   │   │   ├── lib/           # Utility libraries
│   │   │   ├── stores/        # Zustand stores
│   │   │   └── styles/        # Global styles and themes
│   │   ├── public/            # Static assets
│   │   ├── tailwind.config.js # Tailwind configuration
│   │   ├── next.config.js     # Next.js configuration
│   │   └── package.json
│   └── functions/             # Netlify Functions source
│       ├── auth/              # Authentication functions
│       ├── agents/            # AI agent functions
│       ├── itineraries/       # Itinerary CRUD functions
│       └── shared/            # Shared function utilities
├── packages/                  # Shared packages
│   ├── shared/                # Shared types and utilities
│   │   ├── src/
│   │   │   ├── types/         # TypeScript interfaces
│   │   │   ├── constants/     # Shared constants
│   │   │   ├── utils/         # Shared utilities
│   │   │   └── validation/    # Schema validation
│   │   └── package.json
│   ├── database/              # Database utilities and migrations
│   │   ├── src/
│   │   │   ├── migrations/    # SQL migration files
│   │   │   ├── schemas/       # Database schemas
│   │   │   └── client.ts      # Database client setup
│   │   └── package.json
│   └── agents/                # Agent coordination utilities
│       ├── src/
│       │   ├── research/      # Research agent logic
│       │   ├── curation/      # Curation agent logic
│       │   ├── validation/    # Validation agent logic
│       │   ├── response/      # Response agent logic
│       │   └── orchestration/ # Pipeline coordination
│       └── package.json
├── docs/                      # Documentation
│   ├── prd.md                 # Product Requirements Document
│   ├── architecture.md        # This document
│   └── api/                   # API documentation
├── scripts/                   # Build and utility scripts
│   ├── dev.sh                 # Local development setup
│   ├── build.sh               # Production build
│   └── deploy.sh              # Deployment utilities
├── .env.example               # Environment variables template
├── .gitignore                 # Git ignore patterns
├── netlify.toml               # Netlify configuration
├── package.json               # Root package.json with workspaces
├── turbo.json                 # Turborepo configuration (if using)
└── README.md                  # Project overview and setup
```

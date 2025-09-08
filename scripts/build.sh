#!/bin/bash

# Production build script
set -e

echo "🏗️  Building Swift Travel for production..."

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Build shared packages first
echo "🔨 Building shared packages..."
npm run build --workspace=packages/shared
npm run build --workspace=packages/database  
npm run build --workspace=packages/agents

# Build applications
echo "🏗️  Building applications..."
npm run build:web
npm run build:functions

# Run tests
echo "🧪 Running tests..."
npm run test:unit

# Type checking
echo "🔍 Type checking..."
npm run typecheck

# Linting
echo "📝 Linting..."
npm run lint

echo "✅ Production build completed successfully!"
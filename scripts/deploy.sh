#!/bin/bash

# Deployment utilities script
set -e

ENVIRONMENT=${1:-preview}

echo "🚀 Deploying to $ENVIRONMENT environment..."

# Build for production
./scripts/build.sh

# Deploy based on environment
case $ENVIRONMENT in
    "preview")
        echo "📤 Deploying preview..."
        npm run deploy:preview
        ;;
    "production")
        echo "🌟 Deploying to production..."
        npm run deploy:prod
        ;;
    *)
        echo "❌ Invalid environment: $ENVIRONMENT"
        echo "Usage: ./scripts/deploy.sh [preview|production]"
        exit 1
        ;;
esac

echo "✅ Deployment completed successfully!"
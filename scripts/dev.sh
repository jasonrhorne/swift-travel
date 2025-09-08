#!/bin/bash

# Local development setup script
set -e

echo "🚀 Starting Swift Travel development environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if .env files exist
if [ ! -f ".env.local" ]; then
    echo "⚠️  .env.local not found. Creating from .env.example..."
    cp .env.example .env.local
    echo "📝 Please edit .env.local with your API keys and configuration."
fi

if [ ! -f ".env" ]; then
    echo "⚠️  .env not found. Creating from .env.example..."
    cp .env.example .env
    echo "📝 Please edit .env with your API keys and configuration."
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build shared packages
echo "🔨 Building shared packages..."
npm run build --workspace=packages/shared
npm run build --workspace=packages/database
npm run build --workspace=packages/agents

# Start Docker services
echo "🐳 Starting Docker services..."
docker-compose up -d postgres redis

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Run database migrations (if needed)
echo "🗄️  Setting up database..."
# npm run db:migrate

# Start the development server
echo "🌟 Starting development server..."
npm run dev

echo "✅ Development environment is ready!"
echo "🌐 Frontend: http://localhost:3000"
echo "⚙️  Functions: http://localhost:8888"
echo "🗄️  Database: localhost:5432"
echo "🔄 Redis: localhost:6379"
echo "🛠️  PgAdmin: http://localhost:8080 (admin@swifttravel.dev / admin)"
echo "📊 Redis Commander: http://localhost:8081"
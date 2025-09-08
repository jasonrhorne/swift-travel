# Deployment Architecture

## Deployment Strategy

**Frontend Deployment:**
- **Platform:** Netlify Static Hosting with global CDN
- **Build Command:** `npm run build:web`
- **Output Directory:** `apps/web/out` (Next.js static export)
- **CDN/Edge:** Netlify Edge Network with automatic optimization

**Backend Deployment:**
- **Platform:** Netlify Functions (serverless)
- **Build Command:** `npm run build:functions`
- **Deployment Method:** Automatic deployment from `apps/functions/` directory

## CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test:unit
      - run: npm run test:functions
      
      - name: E2E Tests
        run: npm run test:e2e
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}

  deploy-preview:
    needs: test
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run build
      - uses: netlify/actions/cli@master
        with:
          args: deploy --dir=apps/web/out
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}

  deploy-production:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run build
      - uses: netlify/actions/cli@master
        with:
          args: deploy --prod --dir=apps/web/out
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

## Environments

| Environment | Frontend URL | Backend URL | Purpose |
|-------------|--------------|-------------|---------|
| Development | http://localhost:3000 | http://localhost:8888/.netlify/functions | Local development |
| Staging | https://develop--swift-travel.netlify.app | https://develop--swift-travel.netlify.app/.netlify/functions | Pre-production testing |
| Production | https://swift-travel.com | https://swift-travel.com/.netlify/functions | Live environment |

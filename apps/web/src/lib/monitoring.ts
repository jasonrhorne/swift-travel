// Frontend monitoring setup
import * as Sentry from '@sentry/nextjs';

export function initFrontendMonitoring() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  
  if (!dsn) {
    console.warn('Sentry DSN not found, error tracking disabled');
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_ENVIRONMENT || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    integrations: [
      new Sentry.Integrations.BrowserTracing({
        tracingOrigins: ['localhost', /^\//],
      }),
    ],
    beforeSend(event) {
      // Filter out sensitive information
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }
      return event;
    },
  });

  console.log('Frontend monitoring initialized');
}

// Frontend-specific error capture
export function capturePageError(error: Error, errorInfo?: any) {
  Sentry.withScope((scope) => {
    if (errorInfo) {
      scope.setContext('errorInfo', errorInfo);
    }
    scope.setTag('errorBoundary', true);
    Sentry.captureException(error);
  });
}

// User tracking
export function setUser(user: { id: string; email: string; name?: string }) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.name,
  });
}

export function clearUser() {
  Sentry.setUser(null);
}

// Performance tracking
export function trackPageLoad(pageName: string, loadTime: number) {
  Sentry.addBreadcrumb({
    message: `Page loaded: ${pageName}`,
    data: { loadTime },
    category: 'navigation',
  });
}

export function trackUserAction(action: string, data?: Record<string, any>) {
  Sentry.addBreadcrumb({
    message: `User action: ${action}`,
    data,
    category: 'user',
  });
}

// Performance monitoring interface expected by hooks
export const performanceMonitoring = {
  trackEvent(eventName: string, metadata: Record<string, unknown>) {
    Sentry.addBreadcrumb({
      message: `Performance: ${eventName}`,
      data: metadata,
      category: 'performance',
    });
  }
};
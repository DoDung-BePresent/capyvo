import * as Sentry from '@sentry/react'

const dsn = import.meta.env.VITE_SENTRY_DSN
const environment = import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE || 'development'

if (dsn) {
  Sentry.init({
    dsn,
    environment,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0, // 10% in prod, 100% in dev
    // Session Replay
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
    // Don't send errors in test environment
    enabled: environment !== 'test',
    // Ignore common errors
    ignoreErrors: [
      // Network errors
      'NetworkError',
      'Failed to fetch',
      'Network request failed',
      // Browser extensions
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
    ],
  })

  console.log('✅ Sentry initialized:', environment)
} else {
  console.log('⚠️  Sentry DSN not found, error tracking disabled')
}

export { Sentry }

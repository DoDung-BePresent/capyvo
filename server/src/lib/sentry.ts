import * as Sentry from '@sentry/node'
import { nodeProfilingIntegration } from '@sentry/profiling-node'

const dsn = process.env['SENTRY_DSN']
const environment = process.env['SENTRY_ENVIRONMENT'] || process.env['NODE_ENV'] || 'development'

if (dsn) {
  Sentry.init({
    dsn,
    environment,
    integrations: [nodeProfilingIntegration()],
    // Performance Monitoring
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0, // 10% in prod, 100% in dev
    // Profiling
    profilesSampleRate: environment === 'production' ? 0.1 : 1.0,
    // Don't send errors in test environment
    enabled: environment !== 'test',
  })

  console.log('✅ Sentry initialized:', environment)
} else {
  console.log('⚠️  Sentry DSN not found, error tracking disabled')
}

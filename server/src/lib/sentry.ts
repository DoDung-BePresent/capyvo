import * as Sentry from '@sentry/node'
import { nodeProfilingIntegration } from '@sentry/profiling-node'
import { env, isProduction, isTest } from '@/config/env'

if (env.SENTRY_DSN) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    integrations: [nodeProfilingIntegration()],
    // Performance Monitoring
    tracesSampleRate: isProduction ? 0.1 : 1.0, // 10% in prod, 100% in dev
    // Profiling
    profilesSampleRate: isProduction ? 0.1 : 1.0,
    // Don't send errors in test environment
    enabled: !isTest,
  })

  console.log('✅ Sentry initialized:', env.NODE_ENV)
} else {
  console.log('⚠️  Sentry DSN not found, error tracking disabled')
}

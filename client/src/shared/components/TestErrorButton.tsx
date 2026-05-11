import { Button } from 'antd'
import { BugOutlined } from '@ant-design/icons'
import { Sentry } from '@/lib/sentry'

/**
 * Test button to trigger errors for Sentry testing
 * Only visible in development mode
 */
export function TestErrorButton() {
  if (import.meta.env.PROD) return null

  const handleTestError = () => {
    throw new Error('Test error from frontend')
  }

  const handleTestSentryCapture = () => {
    Sentry.captureMessage('Test message from frontend', 'info')
    alert('Test message sent to Sentry! Check your dashboard.')
  }

  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999 }}>
      <Button.Group>
        <Button
          danger
          icon={<BugOutlined />}
          onClick={handleTestError}
          title="Trigger error (will be caught by ErrorBoundary)"
        >
          Test Error
        </Button>
        <Button
          type="primary"
          icon={<BugOutlined />}
          onClick={handleTestSentryCapture}
          title="Send test message to Sentry"
        >
          Test Sentry
        </Button>
      </Button.Group>
    </div>
  )
}

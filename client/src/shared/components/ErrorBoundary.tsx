import { Component, type ReactNode } from 'react'
import { Result, Button, Flex } from 'antd'
import { Sentry } from '@/lib/sentry'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onReset?: () => void
}

interface State {
  hasError: boolean
  error?: Error
  eventId?: string
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: { componentStack?: string }) {
    console.error('ErrorBoundary caught:', error, errorInfo)

    // Send to Sentry
    const eventId = Sentry.captureException(error, {
      level: 'error',
      tags: {
        errorBoundary: true,
      },
      extra: {
        componentStack: errorInfo.componentStack,
      },
    })

    this.setState({ eventId })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, eventId: undefined })
    this.props.onReset?.()
  }

  handleReportFeedback = () => {
    if (this.state.eventId) {
      Sentry.showReportDialog({
        eventId: this.state.eventId,
        title: 'Có lỗi xảy ra',
        subtitle: 'Vui lòng mô tả những gì bạn đang làm khi lỗi xảy ra.',
        subtitle2: 'Chúng tôi sẽ khắc phục sớm nhất có thể.',
        labelName: 'Tên',
        labelEmail: 'Email',
        labelComments: 'Mô tả chi tiết',
        labelClose: 'Đóng',
        labelSubmit: 'Gửi báo cáo',
        errorGeneric: 'Có lỗi khi gửi báo cáo. Vui lòng thử lại.',
        errorFormEntry: 'Vui lòng điền đầy đủ thông tin.',
        successMessage: 'Cảm ơn bạn đã báo cáo! Chúng tôi sẽ xem xét sớm nhất.',
      })
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        if (typeof this.props.fallback === 'object' && this.props.fallback !== null) {
          return (
            <>
              {this.props.fallback}
              {import.meta.env.DEV && this.state.error && (
                <div className="mx-auto max-w-7xl px-6">
                  <details className="mt-6 rounded-sm border border-(--ant-color-error) bg-(--ant-red-1) p-4">
                    <summary className="cursor-pointer font-semibold">
                      Error Details (Dev Only)
                    </summary>
                    <pre className="mt-2 overflow-auto text-xs">
                      {this.state.error.message}
                      {'\n\n'}
                      {this.state.error.stack}
                    </pre>
                  </details>
                </div>
              )}
            </>
          )
        }
        return this.props.fallback
      }

      return (
        <Flex className="min-h-dvh" vertical align="center" justify="center">
          <Result
            status="error"
            title="Có lỗi xảy ra"
            subTitle="Đã xảy ra lỗi không mong muốn. Vui lòng thử làm mới trang hoặc liên hệ hỗ trợ nếu vấn đề vẫn tiếp diễn."
            extra={[
              <Button
                key="refresh"
                type="primary"
                size="large"
                onClick={() => window.location.reload()}
              >
                Làm mới trang
              </Button>,
              <Button key="reset" size="large" onClick={this.handleReset}>
                Thử lại
              </Button>,
              this.state.eventId && (
                <Button key="report" size="large" onClick={this.handleReportFeedback}>
                  Báo cáo lỗi
                </Button>
              ),
            ]}
          />
          {import.meta.env.DEV && this.state.error && (
            <div className="mx-auto max-w-7xl w-full! px-6">
              <details className="mt-6 rounded-sm border border-(--ant-color-error) bg-(--ant-red-1) p-4">
                <summary className="cursor-pointer font-semibold">Error Details (Dev Only)</summary>
                <pre className="mt-2 overflow-auto text-xs">
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                  {this.state.eventId && `\n\nSentry Event ID: ${this.state.eventId}`}
                </pre>
              </details>
            </div>
          )}
        </Flex>
      )
    }

    return this.props.children
  }
}

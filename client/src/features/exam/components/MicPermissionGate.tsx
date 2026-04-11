import { Button, Result, Spin, Typography } from 'antd'
import { AudioOutlined, StopOutlined } from '@ant-design/icons'
import type { ReactNode } from 'react'
import { useMicPermission } from '../hooks/useMicPermission'

const { Text } = Typography

interface Props {
  children: ReactNode
}

export function MicPermissionGate({ children }: Props) {
  const { permission, requestPermission } = useMicPermission()

  if (permission === 'checking') {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Spin size="large" />
      </div>
    )
  }

  if (permission === 'granted') {
    return <>{children}</>
  }

  if (permission === 'denied') {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 40,
        }}
      >
        <Result
          icon={<StopOutlined style={{ color: '#ff4d4f' }} />}
          title="Microphone access denied"
          subTitle={
            <div style={{ maxWidth: 420, margin: '0 auto' }}>
              <Text style={{ display: 'block', marginBottom: 8 }}>
                Bạn đã từ chối quyền truy cập microphone. Vui lòng mở cài đặt trình duyệt, cho phép
                quyền microphone cho trang này, sau đó tải lại trang.
              </Text>
            </div>
          }
          extra={
            <Button type="primary" onClick={() => window.location.reload()}>
              Tải lại trang
            </Button>
          }
        />
      </div>
    )
  }

  // 'prompt' — ask user to allow
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        backgroundColor: '#f5f5f5',
      }}
    >
      <Result
        icon={<AudioOutlined style={{ color: '#4F46E5', fontSize: 48 }} />}
        title="Cho phép microphone"
        subTitle={
          <Text style={{ display: 'block', maxWidth: 420, margin: '0 auto' }}>
            Bài thi yêu cầu quyền truy cập microphone để ghi âm câu trả lời của bạn. Vui lòng nhấn
            nút bên dưới và cho phép trình duyệt truy cập microphone.
          </Text>
        }
        extra={
          <Button type="primary" size="large" icon={<AudioOutlined />} onClick={requestPermission}>
            Cho phép microphone
          </Button>
        }
      />
    </div>
  )
}

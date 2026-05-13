import { useEffect, useState } from 'react'
import { Typography, Space } from 'antd'
import { LaptopOutlined } from '@ant-design/icons'
import { StyledButton } from '@/shared/components'
import { COLORS } from '@/shared/constants/user-color'
import logo from '@/assets/logo.png'

const { Title, Text } = Typography

const MIN_WIDTH = 1024 // Chiều rộng tối thiểu của laptop (1024px)

interface ScreenSizeProviderProps {
  children: React.ReactNode
}

export function ScreenSizeProvider({ children }: ScreenSizeProviderProps) {
  const [isValidScreen, setIsValidScreen] = useState(true)

  useEffect(() => {
    const checkScreenSize = () => {
      setIsValidScreen(window.innerWidth >= MIN_WIDTH)
    }

    // Check ngay khi mount
    checkScreenSize()

    // Listen resize event
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  if (!isValidScreen) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '24px',
          backgroundColor: COLORS.background,
        }}
      >
        <div
          style={{
            background: '#fff',
            borderRadius: 16,
            padding: '48px 32px',
            maxWidth: 480,
            width: '100%',
            textAlign: 'center',
          }}
        >
          <Space direction="vertical" size={24} style={{ width: '100%' }}>
            <img
              src={logo}
              alt="Capyvo Logo"
              style={{
                width: 120,
                height: 120,
                margin: '0 auto',
                display: 'block',
              }}
            />

            <div>
              <Title level={3} style={{ marginBottom: 12, color: COLORS.primary }}>
                Vui lòng sử dụng laptop hoặc máy tính
              </Title>
              <Text type="secondary" style={{ fontSize: 15, lineHeight: 1.6 }}>
                Giao diện mobile đang được phát triển. Hiện tại, vui lòng truy cập từ thiết bị có
                màn hình tối thiểu <strong>1024px</strong> (laptop/desktop) để có trải nghiệm tốt
                nhất.
              </Text>
            </div>

            <StyledButton
              type="primary"
              size="large"
              icon={<LaptopOutlined />}
              onClick={() => window.location.reload()}
              block
              style={{
                backgroundColor: COLORS.primary,
                borderColor: COLORS.primary,
                height: 48,
                fontSize: 16,
              }}
            >
              Tải lại trang
            </StyledButton>
          </Space>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

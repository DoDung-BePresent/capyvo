import { useState } from 'react'
import { Alert, Typography } from 'antd'

/**
 * Icons
 */
import { GoogleOutlined } from '@ant-design/icons'

/**
 * Hooks
 */
import { useLoginWithGoogle } from '../hooks/useAuth'

/**
 * Constants
 */
import { COLORS } from '@/shared/constants/user-color'

/**
 * Assets
 */
import loginImage from '@/assets/images/login-image.webp'
import { StyledButton } from '@/shared/components'

const { Title, Text } = Typography

export default function LoginPage() {
  const [pendingLabel, setPendingLabel] = useState(false)
  const { mutate: loginWithGoogle, isPending, error } = useLoginWithGoogle()

  const onLogin = () => {
    setPendingLabel(true)
    loginWithGoogle()
  }

  return (
    <div className="grid grid-cols-7 gap-5 h-screen">
      <div className="col-span-3 h-full p-5">
        <div
          style={{
            backgroundColor: '#FFE1D7',
          }}
          className="h-full rounded-lg relative flex items-center justify-center overflow-hidden"
        >
          <img
            src={loginImage}
            alt="Capybara"
            className="w-full -left-20 absolute -bottom-20 h-full scale-160 object-cover"
          />
        </div>
      </div>

      <div className="col-span-4 h-full flex flex-col justify-center items-center px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <Title level={2} className="mb-2! ml-10!">
              Sẵn sàng nào? 🎉
            </Title>
            <Text type="secondary" className="text-base">
              Cùng Capyvo chinh phục tiếng Anh thoai
            </Text>
          </div>

          {error && (
            <Alert
              type="error"
              message={(error as Error).message}
              showIcon
              closable
              style={{ marginBottom: 20 }}
            />
          )}

          <StyledButton
            icon={pendingLabel ? null : <GoogleOutlined />}
            size="large"
            block
            loading={isPending}
            onClick={onLogin}
            style={{
              backgroundColor: COLORS.primary,
              borderColor: COLORS.primary,
              height: 48,
              fontSize: 16,
              fontWeight: 500,
            }}
            type="primary"
          >
            {pendingLabel ? 'Yasss!' : 'Đăng nhập với Google'}
          </StyledButton>

          <Text type="secondary" className="text-center block mt-6 text-sm">
            Chỉ cần đăng nhập với Google, nhanh mò ✨
          </Text>
        </div>
      </div>
    </div>
  )
}

import { Button, Typography, Flex, Alert } from 'antd'
import { GoogleOutlined } from '@ant-design/icons'
import { useLoginWithGoogle } from '../hooks/useAuth'

const { Title, Text } = Typography

export default function LoginPage() {
  const { mutate: loginWithGoogle, isPending, error } = useLoginWithGoogle()

  return (
    <Flex justify="center" align="center" style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <div
        style={{
          width: 360,
          padding: '40px 32px',
          borderRadius: 12,
          boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
          background: '#fff',
          textAlign: 'center',
        }}
      >
        <Title level={3} style={{ marginBottom: 4 }}>
          🐹 Capyvo
        </Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: 32 }}>
          Luyện thi TOEIC Speaking mọi lúc, mọi nơi.
        </Text>

        {error && (
          <Alert
            type="error"
            message={(error as Error).message}
            showIcon
            style={{ marginBottom: 16, textAlign: 'left' }}
          />
        )}

        <Button
          icon={<GoogleOutlined />}
          size="large"
          block
          loading={isPending}
          onClick={() => loginWithGoogle()}
        >
          Đăng nhập với Google
        </Button>
      </div>
    </Flex>
  )
}

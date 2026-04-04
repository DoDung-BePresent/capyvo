import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Form, Input, Typography, Alert, Flex } from 'antd'
import { MailOutlined } from '@ant-design/icons'
import { useSendOtp, useVerifyOtp } from '../hooks/useAuth'

const { Title, Text } = Typography

export default function LoginPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [email, setEmail] = useState('')

  const { mutate: sendOtp, isPending: isSending, error: sendError, reset: resetSend } = useSendOtp()
  const {
    mutate: verifyOtp,
    isPending: isVerifying,
    error: verifyError,
    reset: resetVerify,
  } = useVerifyOtp()

  const onEmailSubmit = ({ email: inputEmail }: { email: string }) => {
    sendOtp(inputEmail, {
      onSuccess: () => {
        setEmail(inputEmail)
        setStep('otp')
      },
    })
  }

  const onOtpSubmit = ({ token }: { token: string }) => {
    verifyOtp({ email, token }, { onSuccess: () => navigate('/', { replace: true }) })
  }

  if (step === 'otp') {
    return (
      <Flex justify="center" align="center" style={{ minHeight: '100vh' }}>
        <div
          style={{
            width: 360,
            padding: '40px 32px',
            borderRadius: 12,
            boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
            background: '#fff',
          }}
        >
          <Title level={4} style={{ textAlign: 'center', marginBottom: 4 }}>
            Kiểm tra email của bạn
          </Title>
          <Text
            type="secondary"
            style={{ display: 'block', textAlign: 'center', marginBottom: 24 }}
          >
            Nhập mã 6 số đã gửi tới <strong>{email}</strong>
          </Text>

          <Form layout="vertical" onFinish={onOtpSubmit} requiredMark={false}>
            <Form.Item
              name="token"
              rules={[{ required: true, len: 6, message: 'Vui lòng nhập đủ 6 số' }]}
            >
              <Input.OTP length={6} size="large" style={{ width: '100%' }} />
            </Form.Item>

            {verifyError && (
              <Form.Item>
                <Alert type="error" message="Mã không đúng hoặc đã hết hạn" showIcon />
              </Form.Item>
            )}

            <Form.Item>
              <Button type="primary" htmlType="submit" block size="large" loading={isVerifying}>
                Xác nhận
              </Button>
            </Form.Item>
          </Form>

          <Flex justify="center" gap={4}>
            <Text type="secondary">Không nhận được mã?</Text>
            <Button
              type="link"
              size="small"
              style={{ padding: 0 }}
              onClick={() => {
                resetVerify()
                sendOtp(email)
              }}
              loading={isSending}
            >
              Gửi lại
            </Button>
          </Flex>

          <Flex justify="center" style={{ marginTop: 8 }}>
            <Button
              type="link"
              size="small"
              style={{ padding: 0 }}
              onClick={() => {
                setStep('email')
                resetSend()
              }}
            >
              Dùng email khác
            </Button>
          </Flex>
        </div>
      </Flex>
    )
  }

  return (
    <Flex justify="center" align="center" style={{ minHeight: '100vh' }}>
      <div
        style={{
          width: 360,
          padding: '40px 32px',
          borderRadius: 12,
          boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
          background: '#fff',
        }}
      >
        <Title level={4} style={{ textAlign: 'center', marginBottom: 4 }}>
          Đăng nhập
        </Title>
        <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 24 }}>
          Nhập email — chúng tôi sẽ gửi mã xác nhận, không cần mật khẩu.
        </Text>

        <Form layout="vertical" onFinish={onEmailSubmit} requiredMark={false}>
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Vui lòng nhập email' },
              { type: 'email', message: 'Email không hợp lệ' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="you@example.com" size="large" />
          </Form.Item>

          {sendError && (
            <Form.Item>
              <Alert type="error" message={(sendError as Error).message} showIcon />
            </Form.Item>
          )}

          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large" loading={isSending}>
              Tiếp tục
            </Button>
          </Form.Item>
        </Form>
      </div>
    </Flex>
  )
}

import { useState } from 'react'
import { Button, Form, Input, Typography, Alert } from 'antd'
import { MailOutlined } from '@ant-design/icons'
import { useSendMagicLink } from '../hooks/useAuth'

const { Title, Text } = Typography

export default function LoginPage() {
  const [sent, setSent] = useState(false)
  const [sentEmail, setSentEmail] = useState('')
  const { mutate: sendMagicLink, isPending, error } = useSendMagicLink()

  const onFinish = ({ email }: { email: string }) => {
    sendMagicLink(email, {
      onSuccess: () => {
        setSentEmail(email)
        setSent(true)
      },
    })
  }

  if (sent) {
    return (
      <div style={{ maxWidth: 400, margin: '120px auto', padding: '0 16px' }}>
        <Alert
          type="success"
          message="Kiểm tra email của bạn"
          description={
            <>
              Chúng tôi đã gửi link đăng nhập tới <strong>{sentEmail}</strong>. Nhấn vào link trong
              email để vào ứng dụng.
            </>
          }
          showIcon
        />
        <Button type="link" style={{ marginTop: 12, padding: 0 }} onClick={() => setSent(false)}>
          Dùng email khác
        </Button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 400, margin: '120px auto', padding: '0 16px' }}>
      <Title level={3} style={{ marginBottom: 4 }}>
        Đăng nhập
      </Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        Nhập email — chúng tôi sẽ gửi link đăng nhập, không cần mật khẩu.
      </Text>

      <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
        <Form.Item
          name="email"
          rules={[
            { required: true, message: 'Vui lòng nhập email' },
            { type: 'email', message: 'Email không hợp lệ' },
          ]}
        >
          <Input prefix={<MailOutlined />} placeholder="you@example.com" size="large" />
        </Form.Item>

        {error && (
          <Form.Item>
            <Alert type="error" message={(error as Error).message} showIcon />
          </Form.Item>
        )}

        <Form.Item>
          <Button type="primary" htmlType="submit" block size="large" loading={isPending}>
            Gửi link đăng nhập
          </Button>
        </Form.Item>
      </Form>
    </div>
  )
}

import { useState } from 'react'
import { Card, Form, InputNumber, Button, Space, Typography, Alert, message, Statistic } from 'antd'
import { SaveOutlined, ReloadOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { PageHeader } from '@/shared/components'
import {
  useTrialSettings,
  useUpdateTrialSettings,
  useCheckExpiredTrials,
} from '@/features/auth/hooks/useTrial'

const { Text } = Typography

export default function TrialSettingsPage() {
  const [form] = Form.useForm()
  const { data: settings, isLoading, refetch } = useTrialSettings()
  const updateMutation = useUpdateTrialSettings()
  const checkExpiredMutation = useCheckExpiredTrials()
  const [hasChanges, setHasChanges] = useState(false)

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      await updateMutation.mutateAsync({ days: values.trialDays })
      message.success('Đã cập nhật thời gian dùng thử')
      setHasChanges(false)
      refetch()
    } catch (_error) {
      message.error('Không thể cập nhật cài đặt')
    }
  }

  const handleCheckExpired = async () => {
    try {
      const result = await checkExpiredMutation.mutateAsync()
      message.success(`Đã thu hồi premium cho ${result.revokedCount} người dùng`)
    } catch (_error) {
      message.error('Không thể kiểm tra trial hết hạn')
    }
  }

  const handleReset = () => {
    form.setFieldsValue({ trialDays: settings?.trialDays ?? 7 })
    setHasChanges(false)
  }

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <PageHeader
        title="Cài đặt Premium Trial"
        description="Quản lý thời gian dùng thử Premium cho người dùng mới."
      />

      <Alert
        message="Lưu ý"
        description={
          <Space direction="vertical" size={4}>
            <Text>
              • Người dùng mới sẽ tự động nhận được gói dùng thử Premium khi đăng ký lần đầu.
            </Text>
            <Text>• Mỗi người dùng chỉ được dùng thử 1 lần duy nhất.</Text>
            <Text>
              • Sau khi hết hạn dùng thử, người dùng sẽ chuyển về gói FREE (không có AI chấm điểm,
              không luyện full đề).
            </Text>
            <Text>• Cron job tự động kiểm tra và thu hồi premium mỗi ngày lúc 00:00.</Text>
          </Space>
        }
        type="info"
        showIcon
      />

      <Card
        title="Thời gian dùng thử"
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={() => refetch()}
            loading={isLoading}
            size="small"
          >
            Làm mới
          </Button>
        }
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ trialDays: settings?.trialDays ?? 7 }}
          onValuesChange={() => setHasChanges(true)}
        >
          <Form.Item
            label="Số ngày dùng thử Premium"
            name="trialDays"
            rules={[
              { required: true, message: 'Vui lòng nhập số ngày' },
              { type: 'number', min: 0, max: 365, message: 'Số ngày phải từ 0 đến 365' },
            ]}
            extra="Đặt 0 để tắt tính năng dùng thử. Người dùng mới sẽ bắt đầu với gói FREE."
          >
            <InputNumber min={0} max={365} style={{ width: 200 }} addonAfter="ngày" size="large" />
          </Form.Item>

          <Space>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={updateMutation.isPending}
              disabled={!hasChanges}
            >
              Lưu thay đổi
            </Button>
            <Button onClick={handleReset} disabled={!hasChanges}>
              Hủy
            </Button>
          </Space>
        </Form>
      </Card>

      <Card title="Thống kê & Công cụ">
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Statistic
            title="Thời gian dùng thử hiện tại"
            value={settings?.trialDays ?? 0}
            suffix="ngày"
            prefix={<ClockCircleOutlined />}
          />

          <div>
            <Text strong>Kiểm tra trial hết hạn thủ công</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Cron job tự động chạy mỗi ngày lúc 00:00. Bạn có thể chạy thủ công nếu cần.
            </Text>
            <br />
            <Button
              icon={<ReloadOutlined />}
              onClick={handleCheckExpired}
              loading={checkExpiredMutation.isPending}
              style={{ marginTop: 8 }}
            >
              Kiểm tra ngay
            </Button>
          </div>
        </Space>
      </Card>
    </Space>
  )
}

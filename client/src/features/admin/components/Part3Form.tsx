import { Form, Input, Select, Button, Space, Typography } from 'antd'
import type { Part3FormValues } from '../types'

const { Text } = Typography

interface Props {
  onSubmit: (values: Part3FormValues) => void
  loading?: boolean
}

export default function Part3Form({ onSubmit, loading }: Props) {
  return (
    <Form layout="vertical" onFinish={onSubmit} requiredMark={false}>
      <Form.Item label="Số câu" name="questionNumber" rules={[{ required: true }]}>
        <Select
          options={[
            { value: 5, label: 'Câu 5 (prep 3s / response 15s)' },
            { value: 6, label: 'Câu 6 (prep 3s / response 15s)' },
            { value: 7, label: 'Câu 7 (prep 3s / response 30s)' },
          ]}
        />
      </Form.Item>

      <Form.Item
        label="Bối cảnh (context text — hiển thị cho thí sinh)"
        name="contextText"
        rules={[{ required: true }]}
      >
        <Input.TextArea rows={3} placeholder="Ví dụ: You will be interviewed about your job..." />
      </Form.Item>

      <Form.Item
        label="URL audio bối cảnh"
        name="contextAudioUrl"
        rules={[{ required: true }, { type: 'url', message: 'Nhập URL hợp lệ' }]}
      >
        <Input placeholder="https://..." />
      </Form.Item>

      <Form.Item label="Nội dung câu hỏi" name="questionText" rules={[{ required: true }]}>
        <Input.TextArea rows={2} placeholder="Nhập nội dung câu hỏi..." />
      </Form.Item>

      <Form.Item
        label="URL audio câu hỏi"
        name="questionAudioUrl"
        rules={[{ required: true }, { type: 'url', message: 'Nhập URL hợp lệ' }]}
        extra={
          <Text type="secondary" style={{ fontSize: 12 }}>
            Audio sẽ được đọc tự động sau khi phát bối cảnh xong
          </Text>
        }
      >
        <Input placeholder="https://..." />
      </Form.Item>

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            Lưu câu hỏi
          </Button>
          <Button htmlType="reset">Xóa</Button>
        </Space>
      </Form.Item>
    </Form>
  )
}

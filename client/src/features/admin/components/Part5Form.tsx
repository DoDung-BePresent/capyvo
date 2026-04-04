import { Form, Input, Button, Space } from 'antd'
import type { Part5FormValues } from '../types'

interface Props {
  onSubmit: (values: Part5FormValues) => void
  loading?: boolean
}

export default function Part5Form({ onSubmit, loading }: Props) {
  return (
    <Form layout="vertical" onFinish={onSubmit} requiredMark={false}>
      <Form.Item label="Nội dung câu hỏi" name="questionText" rules={[{ required: true }]}>
        <Input.TextArea rows={3} placeholder="Nhập câu hỏi express an opinion..." />
      </Form.Item>
      <Form.Item
        label="URL audio câu hỏi"
        name="questionAudioUrl"
        rules={[{ required: true }, { type: 'url', message: 'Nhập URL hợp lệ' }]}
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

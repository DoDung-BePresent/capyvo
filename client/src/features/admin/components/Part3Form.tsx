import { Form, Input, Alert, Space } from 'antd'
import type { FormInstance } from 'antd'
import { SoundOutlined } from '@ant-design/icons'
import type { Part3FormValues } from '../types'

interface Props {
  form?: FormInstance
  onSubmit: (values: Part3FormValues) => void
}

export default function Part3Form({ form, onSubmit }: Props) {
  return (
    <Form layout="vertical" onFinish={onSubmit} requiredMark={false} size="large" form={form}>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Form này tạo cùng lúc 3 câu (5, 6, 7). Audio sẽ được tự động tạo bằng AI."
      />

      <Form.Item
        label="Bối cảnh (context — đọc cho thí sinh nghe trước khi trả lời)"
        name="contextText"
        rules={[{ required: true, message: 'Nhập nội dung bối cảnh' }]}
        extra={
          <Space style={{ fontSize: 12, color: '#888' }}>
            <SoundOutlined /> Audio sẽ được tự động tạo từ text này
          </Space>
        }
      >
        <Input.TextArea
          rows={4}
          placeholder="Ví dụ: You will be interviewed about your experience with remote work..."
        />
      </Form.Item>

      {([5, 6, 7] as const).map((num, idx) => (
        <Form.Item
          key={num}
          label={`Câu ${num} — ${idx < 2 ? 'response 15s' : 'response 30s'}`}
          name={`q${num}`}
          rules={[{ required: true, message: `Nhập nội dung câu ${num}` }]}
          extra={
            <Space style={{ fontSize: 12, color: '#888' }}>
              <SoundOutlined /> Audio sẽ được tự động tạo từ text này
            </Space>
          }
        >
          <Input.TextArea rows={2} placeholder={`Nhập nội dung câu hỏi ${num}...`} />
        </Form.Item>
      ))}
    </Form>
  )
}

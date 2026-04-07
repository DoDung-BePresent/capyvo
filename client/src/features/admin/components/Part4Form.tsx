import { Form, Input, Alert, Space } from 'antd'
import type { FormInstance } from 'antd'
import { SoundOutlined } from '@ant-design/icons'
import ImageUpload from './ImageUpload'
import type { Part4FormValues } from '../types'

interface Props {
  form?: FormInstance
  onSubmit: (values: Part4FormValues) => void
}

export default function Part4Form({ form, onSubmit }: Props) {
  return (
    <Form layout="vertical" onFinish={onSubmit} requiredMark={false} size="large" form={form}>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Form này tạo cùng lúc 3 câu (8, 9, 10) dùng chung 1 ảnh. Audio câu hỏi sẽ được tự động tạo bằng AI."
      />

      <Form.Item
        label="Hình ảnh / bảng dữ liệu (dùng chung cho cả 3 câu)"
        name="imageUrl"
        rules={[{ required: true, message: 'Vui lòng tải ảnh lên' }]}
      >
        <ImageUpload />
      </Form.Item>

      {([8, 9, 10] as const).map((num, idx) => (
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

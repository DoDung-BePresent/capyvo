import { Form, Input, Alert } from 'antd'
import type { FormInstance } from 'antd'
import AudioUploadField from './AudioUploadField'
import type { Part3FormValues } from '../types'

interface Props {
  form?: FormInstance
  onSubmit: (values: Part3FormValues) => void
}

export default function Part3Form({ form, onSubmit }: Props) {
  return (
    <Form
      layout="vertical"
      onFinish={onSubmit}
      requiredMark={false}
      size="large"
      form={form}
      styles={{ label: { height: 22 } }}
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Form này tạo cùng lúc 3 câu (5, 6, 7). Mỗi trường có thể tự upload audio hoặc để AI tạo."
      />

      <Form.Item
        label="Bối cảnh (context)"
        name="contextText"
        rules={[{ required: true, message: 'Nhập nội dung bối cảnh' }]}
      >
        <Input.TextArea
          rows={4}
          placeholder="Ví dụ: You will be interviewed about your experience with remote work..."
        />
      </Form.Item>
      <Form.Item label="Audio bối cảnh" name="contextAudioUrl">
        <AudioUploadField />
      </Form.Item>

      {([5, 6, 7] as const).map((num, idx) => (
        <div key={num}>
          <Form.Item
            label={`Câu ${num} — ${idx < 2 ? 'response 15s' : 'response 30s'}`}
            name={`q${num}`}
            rules={[{ required: true, message: `Nhập nội dung câu ${num}` }]}
          >
            <Input.TextArea rows={2} placeholder={`Nhập nội dung câu hỏi ${num}...`} />
          </Form.Item>
          <Form.Item label={`Audio câu ${num}`} name={`q${num}AudioUrl`}>
            <AudioUploadField />
          </Form.Item>
        </div>
      ))}
    </Form>
  )
}

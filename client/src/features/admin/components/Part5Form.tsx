import { Form, Input } from 'antd'
import type { FormInstance } from 'antd'
import AudioUploadField from './AudioUploadField'
import type { Part5FormValues } from '../types'

interface Props {
  form?: FormInstance
  onSubmit: (values: Part5FormValues) => void
}

export default function Part5Form({ form, onSubmit }: Props) {
  return (
    <Form
      layout="vertical"
      onFinish={onSubmit}
      requiredMark={false}
      size="large"
      form={form}
      styles={{ label: { height: 22 } }}
    >
      <Form.Item
        label="Câu hỏi (câu 11 — prep 45s / response 60s)"
        name="questionText"
        rules={[{ required: true, message: 'Nhập nội dung câu hỏi' }]}
      >
        <Input.TextArea
          rows={4}
          placeholder="Ví dụ: Do you think working from home is more productive than working in an office? Why or why not?"
        />
      </Form.Item>
      <Form.Item label="Audio câu hỏi" name="questionAudioUrl">
        <AudioUploadField />
      </Form.Item>
    </Form>
  )
}

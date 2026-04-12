import { useState } from 'react'
import { Form, Input, Alert, Space, Spin, Typography } from 'antd'
import type { FormInstance } from 'antd'
import { RobotOutlined, SoundOutlined } from '@ant-design/icons'
import ImageUpload from './ImageUpload'
import { questionService } from '../services/question.service'
import type { Part4FormValues } from '../types'

const { Text } = Typography

interface Props {
  form?: FormInstance
  onSubmit: (values: Part4FormValues) => void
}

export default function Part4Form({ form, onSubmit }: Props) {
  const [analyzing, setAnalyzing] = useState(false)

  async function handleImageChange(url: string | undefined) {
    form?.setFieldValue('imageUrl', url)
    if (!url) {
      form?.setFieldValue('imageContext', undefined)
      return
    }
    setAnalyzing(true)
    try {
      const context = await questionService.analyzeImage(url)
      form?.setFieldValue('imageContext', context)
    } catch {
      // silently fail — user can type manually
    } finally {
      setAnalyzing(false)
    }
  }

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
        message="Form này tạo cùng lúc 3 câu (8, 9, 10) dùng chung 1 ảnh và 1 bối cảnh. Audio câu hỏi sẽ được tự động tạo bằng AI."
      />

      <Form.Item
        label="Hình ảnh / bảng dữ liệu (dùng chung cho cả 3 câu)"
        name="imageUrl"
        rules={[{ required: true, message: 'Vui lòng tải ảnh lên' }]}
      >
        <ImageUpload onChange={handleImageChange} />
      </Form.Item>

      <Form.Item
        label={
          <span>
            Mô tả hình ảnh (cho AI chấm bài){' '}
            {analyzing && <Spin size="small" style={{ marginLeft: 6 }} />}
          </span>
        }
        name="imageContext"
        extra={
          <Text type="secondary" style={{ fontSize: 12 }}>
            <RobotOutlined style={{ marginRight: 4 }} />
            Tự động điền bằng AI sau khi upload. Chỉnh sửa nếu cần thiết.
          </Text>
        }
      >
        <Input.TextArea rows={4} placeholder="AI sẽ tự mô tả hình ảnh sau khi upload..." />
      </Form.Item>

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
          placeholder="Ví dụ: Imagine you work at a company and your manager asks you..."
        />
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

import { useState } from 'react'
import { Form, Input, Spin, Typography } from 'antd'
import type { FormInstance } from 'antd'
import { RobotOutlined } from '@ant-design/icons'
import ImageUpload from './ImageUpload'
import AudioUploadField from './AudioUploadField'
import { questionService } from '../services/question.service'
import type { PartNumber } from '../types'

const { Text } = Typography

interface Props {
  partNumber: PartNumber
  form: FormInstance
  onSubmit: (values: unknown) => void
}

export default function EditQuestionForm({ partNumber, form, onSubmit }: Props) {
  const [analyzing, setAnalyzing] = useState(false)

  async function handleImageChange(url: string | undefined) {
    form.setFieldValue('imageUrl', url)
    if (!url) {
      form.setFieldValue('imageContext', undefined)
      return
    }
    setAnalyzing(true)
    try {
      const context = await questionService.analyzeImage(url)
      form.setFieldValue('imageContext', context)
    } catch {
      // fall through — user can type manually
    } finally {
      setAnalyzing(false)
    }
  }

  const sharedFormProps = {
    form,
    layout: 'vertical' as const,
    onFinish: onSubmit,
    requiredMark: false,
    size: 'large' as const,
    styles: { label: { height: 22 } },
  }

  if (partNumber === 1) {
    return (
      <Form {...sharedFormProps}>
        <Form.Item
          label="Nội dung đọc"
          name="contentText"
          rules={[{ required: true, message: 'Vui lòng nhập nội dung' }]}
        >
          <Input.TextArea rows={8} placeholder="Nhập đoạn văn cần đọc to..." />
        </Form.Item>
      </Form>
    )
  }

  if (partNumber === 2) {
    return (
      <Form {...sharedFormProps}>
        <Form.Item
          label="Hình ảnh miêu tả"
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
              Tự động điền lại bằng AI nếu thay ảnh mới.
            </Text>
          }
        >
          <Input.TextArea rows={4} placeholder="Mô tả hình ảnh..." />
        </Form.Item>
      </Form>
    )
  }

  if (partNumber === 3) {
    return (
      <Form {...sharedFormProps}>
        <Form.Item
          label="Bối cảnh (context text)"
          name="contextText"
          rules={[{ required: true, message: 'Vui lòng nhập bối cảnh' }]}
        >
          <Input.TextArea rows={4} placeholder="Nhập đoạn bối cảnh..." />
        </Form.Item>

        <Form.Item label="Audio bối cảnh" name="contextAudioUrl">
          <AudioUploadField />
        </Form.Item>

        <Form.Item
          label="Câu hỏi"
          name="questionText"
          rules={[{ required: true, message: 'Vui lòng nhập câu hỏi' }]}
        >
          <Input.TextArea rows={3} placeholder="Nhập nội dung câu hỏi..." />
        </Form.Item>

        <Form.Item label="Audio câu hỏi" name="questionAudioUrl">
          <AudioUploadField />
        </Form.Item>
      </Form>
    )
  }

  if (partNumber === 4) {
    return (
      <Form {...sharedFormProps}>
        <Form.Item
          label="Hình ảnh"
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
              Tự động điền lại bằng AI nếu thay ảnh mới.
            </Text>
          }
        >
          <Input.TextArea rows={4} placeholder="Mô tả hình ảnh..." />
        </Form.Item>

        <Form.Item
          label="Bối cảnh (context text)"
          name="contextText"
          rules={[{ required: true, message: 'Vui lòng nhập bối cảnh' }]}
        >
          <Input.TextArea rows={4} placeholder="Nhập đoạn bối cảnh..." />
        </Form.Item>

        <Form.Item label="Audio bối cảnh" name="contextAudioUrl">
          <AudioUploadField />
        </Form.Item>

        <Form.Item
          label="Câu hỏi"
          name="questionText"
          rules={[{ required: true, message: 'Vui lòng nhập câu hỏi' }]}
        >
          <Input.TextArea rows={3} placeholder="Nhập nội dung câu hỏi..." />
        </Form.Item>

        <Form.Item label="Audio câu hỏi" name="questionAudioUrl">
          <AudioUploadField />
        </Form.Item>
      </Form>
    )
  }

  // Part 5
  return (
    <Form {...sharedFormProps}>
      <Form.Item
        label="Câu hỏi"
        name="questionText"
        rules={[{ required: true, message: 'Vui lòng nhập câu hỏi' }]}
      >
        <Input.TextArea rows={5} placeholder="Nhập câu hỏi..." />
      </Form.Item>

      <Form.Item label="Audio câu hỏi" name="questionAudioUrl">
        <AudioUploadField />
      </Form.Item>
    </Form>
  )
}

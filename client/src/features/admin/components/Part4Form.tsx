import { useState } from 'react'
import { Form, Input, Alert, Spin, Typography, Select, Divider, Flex } from 'antd'
import type { FormInstance } from 'antd'
import { RobotOutlined } from '@ant-design/icons'
import ImageUpload from './ImageUpload'
import AudioUploadField from './AudioUploadField'
import { questionService } from '../services/question.service'
import type { Part4FormValues } from '../types'
import { QuestionType, QuestionStatus } from '../types'
import { TopicMultiSelect } from './TopicMultiSelect'

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
        message="Form này tạo cùng lúc 3 câu (8, 9, 10) dùng chung 1 ảnh và 1 bối cảnh. Mỗi trường có thể tự upload audio hoặc để AI tạo."
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
        label="Bối cảnh (context)"
        name="contextText"
        rules={[{ required: true, message: 'Nhập nội dung bối cảnh' }]}
      >
        <Input.TextArea
          rows={4}
          placeholder="Ví dụ: Imagine you work at a company and your manager asks you..."
        />
      </Form.Item>
      <Form.Item label="Audio bối cảnh" name="contextAudioUrl">
        <AudioUploadField />
      </Form.Item>

      {([8, 9, 10] as const).map((num, idx) => (
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

      <Divider style={{ margin: '16px 0' }} />

      <Flex gap={16}>
        <Form.Item
          label="Loại câu hỏi"
          name="type"
          rules={[{ required: true, message: 'Chọn loại câu hỏi' }]}
          initialValue={QuestionType.PRACTICE}
          style={{ flex: 1 }}
        >
          <Select
            options={[
              { label: 'PRACTICE', value: QuestionType.PRACTICE },
              { label: 'FORECAST', value: QuestionType.FORECAST },
              { label: 'CUSTOM', value: QuestionType.CUSTOM },
            ]}
          />
        </Form.Item>

        <Form.Item
          label="Trạng thái"
          name="status"
          rules={[{ required: true, message: 'Chọn trạng thái' }]}
          initialValue={QuestionStatus.DRAFT}
          style={{ flex: 1 }}
        >
          <Select
            options={[
              { label: 'DRAFT', value: QuestionStatus.DRAFT },
              { label: 'PUBLISHED', value: QuestionStatus.PUBLISHED },
              { label: 'ARCHIVED', value: QuestionStatus.ARCHIVED },
            ]}
          />
        </Form.Item>
      </Flex>

      <Form.Item label="Chủ đề" name="topicIds">
        <TopicMultiSelect />
      </Form.Item>
    </Form>
  )
}

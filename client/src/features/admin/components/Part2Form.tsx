import { useState } from 'react'
import { Form, Input, Segmented, Spin, Typography, Select, Divider, Flex } from 'antd'
import type { FormInstance } from 'antd'
import { RobotOutlined } from '@ant-design/icons'
import ImageUpload from './ImageUpload'
import { questionService } from '../services/question.service'
import type { Part2FormValues } from '../types'
import { QuestionType, QuestionStatus } from '../types'
import { TopicMultiSelect } from './TopicMultiSelect'

const { Text } = Typography

interface Props {
  form?: FormInstance
  onSubmit: (values: Part2FormValues) => void
}

export default function Part2Form({ form, onSubmit }: Props) {
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
      <Form.Item label="Số câu" name="questionNumber" rules={[{ required: true }]}>
        <Segmented
          block
          options={[
            { value: 3, label: 'Câu 3 — prep 45s / response 30s' },
            { value: 4, label: 'Câu 4 — prep 45s / response 30s' },
          ]}
        />
      </Form.Item>

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
            Tự động điền bằng AI sau khi upload. Chỉnh sửa nếu cần thiết.
          </Text>
        }
      >
        <Input.TextArea rows={4} placeholder="AI sẽ tự mô tả hình ảnh sau khi upload..." />
      </Form.Item>

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

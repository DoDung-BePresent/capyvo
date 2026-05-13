import { Form, Input, Select, Divider } from 'antd'
import type { FormInstance } from 'antd'
import AudioUploadField from './AudioUploadField'
import type { Part5FormValues } from '../types'
import { QuestionType, QuestionStatus } from '../types'
import { TopicMultiSelect } from './TopicMultiSelect'

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

      <Divider style={{ margin: '16px 0' }} />

      <Form.Item
        label="Loại câu hỏi"
        name="type"
        rules={[{ required: true, message: 'Chọn loại câu hỏi' }]}
        initialValue={QuestionType.PRACTICE}
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
      >
        <Select
          options={[
            { label: 'DRAFT', value: QuestionStatus.DRAFT },
            { label: 'PUBLISHED', value: QuestionStatus.PUBLISHED },
            { label: 'ARCHIVED', value: QuestionStatus.ARCHIVED },
          ]}
        />
      </Form.Item>

      <Form.Item label="Chủ đề" name="topicIds">
        <TopicMultiSelect />
      </Form.Item>
    </Form>
  )
}

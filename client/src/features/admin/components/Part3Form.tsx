import { Form, Input, Alert, Select, Divider, Flex } from 'antd'
import type { FormInstance } from 'antd'
import AudioUploadField from './AudioUploadField'
import type { Part3FormValues } from '../types'
import { QuestionType, QuestionStatus } from '../types'
import { TopicMultiSelect } from './TopicMultiSelect'

interface Props {
  form?: FormInstance
  onSubmit: (values: Part3FormValues) => void
  editingQuestionNumber?: 5 | 6 | 7 // When editing, only show this question
}

export default function Part3Form({ form, onSubmit, editingQuestionNumber }: Props) {
  const isEditing = editingQuestionNumber !== undefined
  const questionsToShow = isEditing ? [editingQuestionNumber] : ([5, 6, 7] as const)

  return (
    <Form
      layout="vertical"
      onFinish={onSubmit}
      requiredMark={false}
      size="large"
      form={form}
      styles={{ label: { height: 22 } }}
    >
      {!isEditing && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          description="Form này tạo cùng lúc 3 câu (5, 6, 7). Mỗi trường có thể tự upload audio hoặc để AI tạo."
        />
      )}

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

      {questionsToShow.map((num, idx) => (
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
        <TopicMultiSelect partNumber={3} />
      </Form.Item>
    </Form>
  )
}

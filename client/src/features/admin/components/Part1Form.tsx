import { Form, Input, Segmented, Select, Divider, Flex } from 'antd'
import type { FormInstance } from 'antd'
import type { Part1FormValues } from '../types'
import { QuestionType, QuestionStatus } from '../types'
import { TopicMultiSelect } from './TopicMultiSelect'

interface Props {
  form?: FormInstance
  onSubmit: (values: Part1FormValues) => void
}

export default function Part1Form({ form, onSubmit }: Props) {
  return (
    <Form
      layout="vertical"
      onFinish={onSubmit}
      requiredMark={false}
      size="large"
      form={form}
      styles={{
        label: {
          height: 22,
        },
      }}
    >
      <Form.Item label="Số câu" name="questionNumber" rules={[{ required: true }]}>
        <Segmented
          block
          options={[
            { value: 1, label: 'Câu 1 — prep 45s / response 45s' },
            { value: 2, label: 'Câu 2 — prep 45s / response 45s' },
          ]}
        />
      </Form.Item>

      <Form.Item
        label="Nội dung đoạn văn (thí sinh sẽ đọc to đoạn này)"
        name="contentText"
        rules={[{ required: true, message: 'Nhập nội dung đoạn văn' }]}
      >
        <Input.TextArea rows={6} placeholder="Nhập đoạn văn bản để thí sinh đọc to..." />
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
        <TopicMultiSelect partNumber={1} />
      </Form.Item>
    </Form>
  )
}

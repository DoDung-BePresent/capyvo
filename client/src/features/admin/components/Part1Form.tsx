import { Form, Input, Select, Button, Space } from 'antd'
import type { Part1FormValues } from '../types'

interface Props {
  onSubmit: (values: Part1FormValues) => void
  loading?: boolean
}

export default function Part1Form({ onSubmit, loading }: Props) {
  return (
    <Form layout="vertical" onFinish={onSubmit} requiredMark={false}>
      <Form.Item label="Số câu" name="questionNumber" rules={[{ required: true }]}>
        <Select
          options={[
            { value: 1, label: 'Câu 1' },
            { value: 2, label: 'Câu 2' },
          ]}
        />
      </Form.Item>
      <Form.Item
        label="Nội dung đọc (text hiển thị trên màn hình)"
        name="contentText"
        rules={[{ required: true, message: 'Vui lòng nhập nội dung' }]}
      >
        <Input.TextArea rows={6} placeholder="Nhập đoạn văn bản để thí sinh đọc to..." />
      </Form.Item>
      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            Lưu câu hỏi
          </Button>
          <Button htmlType="reset">Xóa</Button>
        </Space>
      </Form.Item>
    </Form>
  )
}

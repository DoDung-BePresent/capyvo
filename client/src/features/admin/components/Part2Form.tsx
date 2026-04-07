import { Form, Select, Button, Space } from 'antd'
import ImageUpload from './ImageUpload'
import type { Part2FormValues } from '../types'

interface Props {
  onSubmit: (values: Part2FormValues) => void
  loading?: boolean
}

export default function Part2Form({ onSubmit, loading }: Props) {
  return (
    <Form layout="vertical" onFinish={onSubmit} requiredMark={false} size="large">
      <Form.Item label="Số câu" name="questionNumber" rules={[{ required: true }]}>
        <Select
          placeholder="Chọn câu"
          options={[
            { value: 3, label: 'Câu 3 (prep 45s / response 30s)' },
            { value: 4, label: 'Câu 4 (prep 45s / response 30s)' },
          ]}
        />
      </Form.Item>

      <Form.Item
        label="Hình ảnh miêu tả"
        name="imageUrl"
        rules={[{ required: true, message: 'Vui lòng tải ảnh lên' }]}
      >
        <ImageUpload />
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

import { Form, Input, Select, Button, Space, Typography } from 'antd'
import type { Part4FormValues } from '../types'

const { Text } = Typography

interface Props {
  onSubmit: (values: Part4FormValues) => void
  loading?: boolean
}

export default function Part4Form({ onSubmit, loading }: Props) {
  return (
    <Form layout="vertical" onFinish={onSubmit} requiredMark={false}>
      <Form.Item label="Số câu" name="questionNumber" rules={[{ required: true }]}>
        <Select
          options={[
            { value: 8, label: 'Câu 8 (prep 3s / response 15s)' },
            { value: 9, label: 'Câu 9 (prep 3s / response 15s)' },
            { value: 10, label: 'Câu 10 (prep 3s / response 30s)' },
          ]}
        />
      </Form.Item>

      <Form.List name="imageUrls" initialValue={['']}>
        {(fields, { add, remove }) => (
          <Form.Item
            label={
              <Text>
                URL hình ảnh{' '}
                <Text type="secondary" style={{ fontSize: 12 }}>
                  (Part 4 dùng chung bảng thông tin)
                </Text>
              </Text>
            }
          >
            {fields.map((field, index) => (
              <Space key={field.key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                <Form.Item
                  {...field}
                  rules={[
                    { required: true, message: 'Nhập URL' },
                    { type: 'url', message: 'URL không hợp lệ' },
                  ]}
                  style={{ marginBottom: 0, flex: 1, minWidth: 360 }}
                >
                  <Input placeholder={`URL hình ${index + 1}`} />
                </Form.Item>
                {fields.length > 1 && (
                  <Button type="text" danger onClick={() => remove(field.name)}>
                    Xóa
                  </Button>
                )}
              </Space>
            ))}
            <Button type="dashed" onClick={() => add()} style={{ marginTop: 4 }}>
              + Thêm hình
            </Button>
          </Form.Item>
        )}
      </Form.List>

      <Form.Item label="Nội dung câu hỏi" name="questionText" rules={[{ required: true }]}>
        <Input.TextArea rows={2} placeholder="Nhập nội dung câu hỏi..." />
      </Form.Item>

      <Form.Item
        label="URL audio câu hỏi"
        name="questionAudioUrl"
        rules={[{ required: true }, { type: 'url', message: 'Nhập URL hợp lệ' }]}
        extra={
          <Text type="secondary" style={{ fontSize: 12 }}>
            Audio đọc sau 45s prep chung của Part 4
          </Text>
        }
      >
        <Input placeholder="https://..." />
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

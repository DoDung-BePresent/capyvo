import { Form, Select } from 'antd'
import type { FormInstance } from 'antd'
import ImageUpload from './ImageUpload'
import type { Part2FormValues } from '../types'

interface Props {
  form?: FormInstance
  onSubmit: (values: Part2FormValues) => void
}

export default function Part2Form({ form, onSubmit }: Props) {
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
    </Form>
  )
}

import { Drawer, Form, Input, Button, App, Select, Tag } from 'antd'
import { useEffect } from 'react'
import { DRAWER_WIDTHS } from '@/config'
import { useCreateTopic, useUpdateTopic } from '../hooks/useTopic'
import type { Topic, PartNumber } from '../types'
import { PART_META } from '../types'

interface Props {
  open: boolean
  onClose: () => void
  topic?: Topic | null
  defaultPartNumber?: PartNumber
}

interface FormValues {
  name: string
  partNumber: PartNumber
  description?: string
}

/**
 * Drawer for creating and editing topics
 * Validates: Requirements 8.1, 8.3, 8.6
 */
export function TopicFormDrawer({ open, onClose, topic, defaultPartNumber = 1 }: Props) {
  const [form] = Form.useForm<FormValues>()
  const { message } = App.useApp()
  const createMutation = useCreateTopic()
  const updateMutation = useUpdateTopic(topic?.id ?? '')

  const isEditMode = !!topic
  const isLoading = createMutation.isPending || updateMutation.isPending

  // Populate form when editing
  useEffect(() => {
    if (open && topic) {
      form.setFieldsValue({
        name: topic.name,
        partNumber: topic.partNumber as PartNumber,
        description: topic.description,
      })
    } else if (open && !topic) {
      form.resetFields()
      form.setFieldsValue({
        partNumber: defaultPartNumber,
      })
    }
  }, [open, topic, form, defaultPartNumber])

  function handleSubmit(values: FormValues) {
    // Validate: Requirements 8.6 - Topic name cannot be empty or whitespace-only
    const trimmedName = values.name.trim()
    if (!trimmedName) {
      void message.error('Tên chủ đề không được để trống')
      return
    }

    const payload = {
      name: trimmedName,
      partNumber: values.partNumber,
      description: values.description?.trim() || undefined,
    }

    if (isEditMode) {
      // Validates: Requirements 8.3
      // Note: partNumber cannot be changed when editing
      const { partNumber: _partNumber, ...updatePayload } = payload
      updateMutation.mutate(updatePayload, {
        onSuccess: () => {
          void message.success('Đã cập nhật chủ đề')
          form.resetFields()
          onClose()
        },
        onError: (error: Error) => {
          void message.error(error.message || 'Không thể cập nhật chủ đề')
        },
      })
    } else {
      // Validates: Requirements 8.1
      createMutation.mutate(payload, {
        onSuccess: () => {
          void message.success('Tạo chủ đề thành công!')
          form.resetFields()
          onClose()
        },
        onError: (error: Error) => {
          void message.error(error.message || 'Không thể tạo chủ đề')
        },
      })
    }
  }

  function handleCancel() {
    form.resetFields()
    onClose()
  }

  const partOptions = ([1, 2, 3, 4, 5] as PartNumber[]).map((partNumber) => {
    const meta = PART_META[partNumber]
    return {
      value: partNumber,
      label: (
        <Tag
          color={meta.color}
          style={{
            fontWeight: 600,
            borderColor: meta.color,
            backgroundColor: `${meta.color}18`,
          }}
        >
          {meta.label}
        </Tag>
      ),
    }
  })

  return (
    <Drawer
      title={isEditMode ? 'Chỉnh sửa chủ đề' : 'Tạo chủ đề mới'}
      open={open}
      onClose={handleCancel}
      width={DRAWER_WIDTHS.small}
      destroyOnHidden
      closeIcon={null}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button size="large" onClick={handleCancel}>
            Huỷ
          </Button>
          <Button
            type="primary"
            size="large"
            htmlType="submit"
            loading={isLoading}
            onClick={() => form.submit()}
          >
            {isEditMode ? 'Cập nhật' : 'Tạo chủ đề'}
          </Button>
        </div>
      }
    >
      <Form
        form={form}
        size="large"
        layout="vertical"
        onFinish={handleSubmit}
        styles={{
          label: {
            height: 22,
          },
        }}
      >
        <Form.Item
          label="Part"
          name="partNumber"
          rules={[{ required: true, message: 'Vui lòng chọn part' }]}
        >
          <Select
            options={partOptions}
            placeholder="Chọn part"
            disabled={isEditMode}
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item
          label="Tên chủ đề"
          name="name"
          rules={[
            { required: true, message: 'Vui lòng nhập tên chủ đề' },
            { whitespace: true, message: 'Tên chủ đề không được chỉ chứa khoảng trắng' },
            { max: 100, message: 'Tên chủ đề không được vượt quá 100 ký tự' },
          ]}
        >
          <Input placeholder="Ví dụ: Tả người, Tả vật, Tả địa điểm" maxLength={100} />
        </Form.Item>

        <Form.Item
          label="Mô tả (tùy chọn)"
          name="description"
          rules={[{ max: 500, message: 'Mô tả không được vượt quá 500 ký tự' }]}
        >
          <Input.TextArea
            rows={3}
            placeholder="Mô tả ngắn về chủ đề này..."
            maxLength={500}
            showCount
          />
        </Form.Item>
      </Form>
    </Drawer>
  )
}

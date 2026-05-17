import { useEffect } from 'react'
import { Drawer, Form, DatePicker, Input, Select, Switch, Button, App, Space } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useCreateSchedule, useUpdateSchedule } from '@/features/admin/hooks/useMaintenanceSchedule'
import type { MaintenanceSchedule, MaintenanceScope } from '@/features/admin/types/maintenance'
import { SCOPE_LABELS } from '@/features/admin/types/maintenance'

interface Props {
  open: boolean
  schedule: MaintenanceSchedule | null
  onClose: () => void
}

interface FormValues {
  scope: MaintenanceScope
  title: string
  message: string
  startAt?: Dayjs | null
  endAt?: Dayjs | null
  isActive: boolean
}

export function MaintenanceScheduleDrawer({ open, schedule, onClose }: Props) {
  const [form] = Form.useForm<FormValues>()
  const { message } = App.useApp()

  const { mutate: createSchedule, isPending: isCreating } = useCreateSchedule()
  const { mutate: updateSchedule, isPending: isUpdating } = useUpdateSchedule()

  const isEditing = !!schedule

  useEffect(() => {
    if (open && schedule) {
      form.setFieldsValue({
        scope: schedule.scope,
        title: schedule.title,
        message: schedule.message,
        startAt: schedule.startAt ? dayjs(schedule.startAt) : null,
        endAt: schedule.endAt ? dayjs(schedule.endAt) : null,
        isActive: schedule.isActive,
      })
    } else if (open) {
      form.resetFields()
    }
  }, [open, schedule, form])

  function handleSubmit(values: FormValues) {
    const startAt = values.startAt?.toISOString() ?? null
    const endAt = values.endAt?.toISOString() ?? null

    if (startAt && endAt && new Date(startAt) >= new Date(endAt)) {
      void message.error('Thời gian bắt đầu phải trước thời gian kết thúc')
      return
    }

    const dto = {
      scope: values.scope,
      title: values.title,
      message: values.message,
      startAt,
      endAt,
      isActive: values.isActive,
    }

    if (isEditing) {
      updateSchedule(
        { id: schedule.id, dto },
        {
          onSuccess: () => {
            void message.success('Đã cập nhật lịch bảo trì')
            onClose()
          },
          onError: () => {
            void message.error('Không thể cập nhật lịch')
          },
        },
      )
    } else {
      createSchedule(dto, {
        onSuccess: () => {
          void message.success('Đã tạo lịch bảo trì')
          onClose()
        },
        onError: () => {
          void message.error('Không thể tạo lịch')
        },
      })
    }
  }

  return (
    <Drawer
      closeIcon={null}
      title={isEditing ? 'Chỉnh sửa lịch bảo trì' : 'Tạo lịch bảo trì mới'}
      open={open}
      onClose={onClose}
      width={600}
      destroyOnClose
      footer={
        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
          <Button size="large" onClick={onClose}>
            Hủy
          </Button>
          <Button
            type="primary"
            size="large"
            onClick={() => form.submit()}
            loading={isCreating || isUpdating}
          >
            {isEditing ? 'Cập nhật' : 'Tạo lịch'}
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        size="large"
        onFinish={handleSubmit}
        requiredMark={false}
        initialValues={{
          scope: 'GLOBAL',
          isActive: false,
        }}
        styles={{
          label: {
            height: 22,
          },
        }}
      >
        <Form.Item
          label="Phạm vi bảo trì"
          name="scope"
          rules={[{ required: true, message: 'Vui lòng chọn phạm vi' }]}
        >
          <Select
            placeholder="Chọn phạm vi"
            options={Object.entries(SCOPE_LABELS).map(([value, label]) => ({
              value,
              label,
            }))}
            disabled={isEditing}
          />
        </Form.Item>

        <Form.Item
          label="Tiêu đề"
          name="title"
          rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
        >
          <Input placeholder="Ví dụ: Bảo trì PayOS" maxLength={100} showCount />
        </Form.Item>

        <Form.Item
          label="Thông báo hiển thị cho người dùng"
          name="message"
          rules={[{ required: true, message: 'Vui lòng nhập thông báo' }]}
        >
          <Input.TextArea
            rows={3}
            placeholder="Ví dụ: Hệ thống thanh toán đang bảo trì từ 8h-10h ngày 20/05. Vui lòng quay lại sau."
            maxLength={500}
            showCount
          />
        </Form.Item>

        <Space.Compact block>
          <Form.Item
            label="Tự động bật lúc"
            name="startAt"
            tooltip="Để trống = bật ngay khi chuyển trạng thái"
            style={{ flex: 1, marginBottom: 0 }}
          >
            <DatePicker
              showTime={{ format: 'HH:mm' }}
              format="HH:mm DD/MM/YYYY"
              placeholder="Chọn thời gian bắt đầu"
              disabledDate={(d) => d.isBefore(dayjs(), 'day')}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            label="Tự động tắt lúc"
            name="endAt"
            tooltip="Để trống = không tự động tắt"
            style={{ flex: 1, marginLeft: 16 }}
          >
            <DatePicker
              showTime={{ format: 'HH:mm' }}
              format="HH:mm DD/MM/YYYY"
              placeholder="Chọn thời gian kết thúc"
              disabledDate={(d) => d.isBefore(dayjs(), 'day')}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Space.Compact>

        <Form.Item
          label="Bật ngay"
          name="isActive"
          valuePropName="checked"
          tooltip="Bật ngay sau khi tạo (nếu không có thời gian bắt đầu)"
        >
          <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
        </Form.Item>
      </Form>
    </Drawer>
  )
}

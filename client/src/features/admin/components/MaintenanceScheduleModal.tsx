import { Modal, Form, DatePicker, Input, Space, Button, Descriptions, Typography, App } from 'antd'
import { DeleteOutlined } from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import {
  useMaintenance,
  useMaintenanceScheduleMutation,
  useClearScheduleMutation,
} from '@/shared/hooks/useMaintenance'
import { MODAL_WIDTHS } from '@/config'

interface Props {
  open: boolean
  onClose: () => void
}

interface FormValues {
  start?: Dayjs
  end?: Dayjs
  message?: string
}

const { Text } = Typography

export function MaintenanceScheduleModal({ open, onClose }: Props) {
  const [form] = Form.useForm<FormValues>()
  const { schedule } = useMaintenance()
  const { mutate: setSchedule, isPending: isSetting } = useMaintenanceScheduleMutation()
  const { mutate: clearSchedule, isPending: isClearing } = useClearScheduleMutation()
  const { message } = App.useApp()

  function handleSubmit(values: FormValues) {
    const start = values.start?.toISOString() ?? null
    const end = values.end?.toISOString() ?? null
    if (start && end && new Date(start) >= new Date(end)) {
      void message.error('Thời gian bắt đầu phải trước thời gian kết thúc')
      return
    }
    setSchedule(
      { start, end, message: values.message ?? '' },
      {
        onSuccess: () => {
          void message.success('Đã đặt lịch bảo trì')
          form.resetFields()
          onClose()
        },
        onError: () => void message.error('Không thể đặt lịch'),
      },
    )
  }

  function handleClear() {
    clearSchedule(undefined, {
      onSuccess: () => {
        void message.success('Đã xoá lịch bảo trì')
        onClose()
      },
      onError: () => void message.error('Không thể xoá lịch'),
    })
  }

  return (
    <Modal
      title="Lên lịch bảo trì"
      open={open}
      onCancel={onClose}
      footer={null}
      width={MODAL_WIDTHS.medium}
      destroyOnClose
    >
      {schedule && (
        <Descriptions
          size="small"
          bordered
          column={1}
          style={{ marginBottom: 20 }}
          title={<Text type="warning">Lịch hiện tại</Text>}
        >
          {schedule.start && (
            <Descriptions.Item label="Bắt đầu">
              {dayjs(schedule.start).format('HH:mm DD/MM/YYYY')}
            </Descriptions.Item>
          )}
          {schedule.end && (
            <Descriptions.Item label="Kết thúc">
              {dayjs(schedule.end).format('HH:mm DD/MM/YYYY')}
            </Descriptions.Item>
          )}
          {schedule.message && (
            <Descriptions.Item label="Thông báo">{schedule.message}</Descriptions.Item>
          )}
        </Descriptions>
      )}

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
        <Form.Item label="Tự động bật lúc" name="start">
          <DatePicker
            showTime={{ format: 'HH:mm' }}
            format="HH:mm DD/MM/YYYY"
            placeholder="Chọn thời gian bắt đầu"
            disabledDate={(d) => d.isBefore(dayjs(), 'day')}
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item label="Tự động tắt lúc" name="end">
          <DatePicker
            showTime={{ format: 'HH:mm' }}
            format="HH:mm DD/MM/YYYY"
            placeholder="Chọn thời gian kết thúc"
            disabledDate={(d) => d.isBefore(dayjs(), 'day')}
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item label="Thông báo hiển thị cho người dùng" name="message">
          <Input.TextArea
            rows={2}
            placeholder="Hệ thống đang nâng cấp để cải thiện trải nghiệm..."
            maxLength={200}
            showCount
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0 }}>
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            {schedule ? (
              <Button danger icon={<DeleteOutlined />} loading={isClearing} onClick={handleClear}>
                Xoá lịch
              </Button>
            ) : (
              <span />
            )}
            <Space>
              <Button onClick={onClose}>Huỷ</Button>
              <Button type="primary" htmlType="submit" loading={isSetting}>
                Đặt lịch
              </Button>
            </Space>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  )
}

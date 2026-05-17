import { useState } from 'react'
import { Button, Table, Tag, Space, Popconfirm, Switch, App, Typography } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, ClockCircleOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { PageHeader } from '@/shared/components'
import {
  useMaintenanceSchedules,
  useDeleteSchedule,
  useToggleScheduleActive,
} from '../../hooks/useMaintenanceSchedule'
import type { MaintenanceSchedule } from '../../types/maintenance'
import { SCOPE_LABELS, SCOPE_COLORS } from '../../types/maintenance'
import { MaintenanceScheduleDrawer } from './components/MaintenanceScheduleDrawer'

const { Text } = Typography

export default function MaintenanceSchedulesPage() {
  const { message } = App.useApp()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<MaintenanceSchedule | null>(null)

  const { data: schedules, isLoading } = useMaintenanceSchedules()
  const { mutate: deleteSchedule, isPending: isDeleting } = useDeleteSchedule()
  const { mutate: toggleActive, isPending: isToggling } = useToggleScheduleActive()

  function handleCreate() {
    setEditingSchedule(null)
    setIsDrawerOpen(true)
  }

  function handleEdit(schedule: MaintenanceSchedule) {
    setEditingSchedule(schedule)
    setIsDrawerOpen(true)
  }

  function handleDelete(id: string) {
    deleteSchedule(id, {
      onSuccess: () => {
        void message.success('Đã xóa lịch bảo trì')
      },
      onError: () => {
        void message.error('Không thể xóa lịch bảo trì')
      },
    })
  }

  function handleToggle(id: string) {
    toggleActive(id, {
      onSuccess: (schedule) => {
        void message.success(schedule.isActive ? 'Đã bật bảo trì' : 'Đã tắt bảo trì')
      },
      onError: () => {
        void message.error('Không thể thay đổi trạng thái')
      },
    })
  }

  const columns = [
    {
      title: 'Phạm vi',
      dataIndex: 'scope',
      key: 'scope',
      width: 200,
      render: (scope: string) => (
        <Tag color={SCOPE_COLORS[scope as keyof typeof SCOPE_COLORS]}>
          {SCOPE_LABELS[scope as keyof typeof SCOPE_LABELS]}
        </Tag>
      ),
    },
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      width: 200,
    },
    {
      title: 'Thông báo',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
    },
    {
      title: 'Thời gian',
      key: 'time',
      width: 300,
      render: (_: unknown, record: MaintenanceSchedule) => (
        <Space direction="vertical" size={0}>
          {record.startAt ? (
            <Text type="secondary" style={{ fontSize: 12 }}>
              <ClockCircleOutlined /> Bắt đầu: {dayjs(record.startAt).format('HH:mm DD/MM/YYYY')}
            </Text>
          ) : (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Bắt đầu: Ngay khi bật
            </Text>
          )}
          {record.endAt ? (
            <Text type="secondary" style={{ fontSize: 12 }}>
              <ClockCircleOutlined /> Kết thúc: {dayjs(record.endAt).format('HH:mm DD/MM/YYYY')}
            </Text>
          ) : (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Kết thúc: Không tự động tắt
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive: boolean, record: MaintenanceSchedule) => (
        <Switch
          checked={isActive}
          loading={isToggling}
          onChange={() => handleToggle(record.id)}
          checkedChildren="Bật"
          unCheckedChildren="Tắt"
        />
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 120,
      render: (_: unknown, record: MaintenanceSchedule) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Xóa lịch bảo trì?"
            description="Bạn có chắc chắn muốn xóa lịch này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              loading={isDeleting}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <Space direction="vertical" size={0} style={{ width: '100%' }}>
      <PageHeader
        title="Quản lý lịch bảo trì"
        description="Tạo và quản lý lịch bảo trì cho các phạm vi khác nhau của hệ thống."
        breadcrumbs={[{ label: 'Quản lý lịch bảo trì' }]}
        extra={
          <Button type="primary" icon={<PlusOutlined />} size="large" onClick={handleCreate}>
            Tạo lịch mới
          </Button>
        }
      />

      <Table
        columns={columns}
        dataSource={schedules}
        rowKey="id"
        loading={isLoading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} lịch`,
        }}
      />

      <MaintenanceScheduleDrawer
        open={isDrawerOpen}
        schedule={editingSchedule}
        onClose={() => {
          setIsDrawerOpen(false)
          setEditingSchedule(null)
        }}
      />
    </Space>
  )
}

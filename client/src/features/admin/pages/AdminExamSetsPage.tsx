import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Drawer, Form, Input, Popconfirm, Select, Space, Tag, Typography } from 'antd'
import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

import { PageHeader, DataTable } from '@/shared/components'
import { DRAWER_WIDTHS } from '@/config'
import type { ExamSet, CreateExamSetPayload, ExamSetType } from '../types'
import {
  useGetExamSets,
  useCreateExamSet,
  useDeleteExamSet,
  useUpdateExamSet,
} from '../hooks/useExamSet'

const { Text } = Typography

const TYPE_LABELS: Record<ExamSetType, string> = {
  PRACTICE: 'Luyện tập',
  FORECAST: 'Dự đoán',
  CUSTOM: 'Tùy chỉnh',
}

const TYPE_COLORS: Record<ExamSetType, string> = {
  PRACTICE: 'blue',
  FORECAST: 'volcano',
  CUSTOM: 'purple',
}

export default function AdminExamSetsPage() {
  const navigate = useNavigate()
  const { data: examSets = [], isLoading } = useGetExamSets()
  const { mutate: deleteExamSet, isPending: deleting } = useDeleteExamSet()

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form] = Form.useForm<CreateExamSetPayload>()

  const createMutation = useCreateExamSet()
  const updateMutation = useUpdateExamSet(editingId ?? '')

  const isPending = editingId ? updateMutation.isPending : createMutation.isPending

  const openCreate = () => {
    setEditingId(null)
    form.resetFields()
    setDrawerOpen(true)
  }

  const openEdit = (record: ExamSet) => {
    setEditingId(record.id)
    form.setFieldsValue({
      title: record.title,
      description: record.description ?? '',
      type: record.type,
    })
    setDrawerOpen(true)
  }

  const handleSubmit = (values: CreateExamSetPayload) => {
    const onSuccess = () => {
      form.resetFields()
      setDrawerOpen(false)
      setEditingId(null)
    }
    if (editingId) {
      updateMutation.mutate(values, { onSuccess })
    } else {
      createMutation.mutate(values, { onSuccess })
    }
  }

  const columns: ColumnsType<ExamSet> = [
    {
      title: 'Tên bộ đề',
      dataIndex: 'title',
      render: (title: string, record) => (
        <Space direction="vertical" size={2}>
          <Text strong>{title}</Text>
          {record.description && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.description}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      width: 130,
      render: (type: ExamSetType) => <Tag color={TYPE_COLORS[type]}>{TYPE_LABELS[type]}</Tag>,
    },
    {
      title: 'Câu hỏi',
      width: 100,
      render: (_, record) => <Text>{record._count?.questions ?? 0} / 11</Text>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isPublished',
      width: 120,
      render: (isPublished: boolean) => (
        <Tag color={isPublished ? 'green' : 'default'}>{isPublished ? 'Đã xuất bản' : 'Nháp'}</Tag>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/admin/exam-sets/${record.id}`)}
          />
          <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm
            title="Xóa bộ đề này?"
            description="Các câu hỏi sẽ được gỡ khỏi bộ đề nhưng không bị xóa."
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
            onConfirm={() => deleteExamSet(record.id)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} loading={deleting} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <Space direction="vertical" size={0} style={{ width: '100%' }}>
      <PageHeader
        title="Bộ đề"
        description="Quản lý các bộ đề thi TOEIC Speaking"
        breadcrumbs={[{ label: 'Bộ đề' }]}
        extra={
          <Button type="primary" icon={<PlusOutlined />} size="large" onClick={openCreate}>
            Tạo bộ đề
          </Button>
        }
      />

      <DataTable
        dataSource={examSets}
        columns={columns}
        rowKey="id"
        size="large"
        loading={isLoading}
      />

      <Drawer
        title={editingId ? 'Chỉnh sửa bộ đề' : 'Tạo bộ đề mới'}
        placement="right"
        width={DRAWER_WIDTHS.small}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        destroyOnHidden
        closeIcon={null}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button size="large" onClick={() => form.resetFields()}>
              Xóa
            </Button>
            <Button type="primary" size="large" loading={isPending} onClick={() => form.submit()}>
              {editingId ? 'Lưu thay đổi' : 'Tạo bộ đề'}
            </Button>
          </div>
        }
      >
        <Form
          form={form}
          layout="vertical"
          size="large"
          onFinish={handleSubmit}
          initialValues={{ type: 'PRACTICE' }}
        >
          <Form.Item
            name="title"
            label="Tên bộ đề"
            rules={[{ required: true, message: 'Nhập tên bộ đề' }]}
          >
            <Input placeholder="VD: Bộ đề luyện tập tháng 4" />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} placeholder="Mô tả ngắn về bộ đề..." />
          </Form.Item>
          <Form.Item name="type" label="Loại">
            <Select
              options={[
                { value: 'PRACTICE', label: 'Luyện tập' },
                { value: 'FORECAST', label: 'Dự đoán' },
                { value: 'CUSTOM', label: 'Tùy chỉnh' },
              ]}
            />
          </Form.Item>
        </Form>
      </Drawer>
    </Space>
  )
}

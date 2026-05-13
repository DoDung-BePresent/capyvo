import { useState } from 'react'
import { Button, Popconfirm, Space, Tag, Typography } from 'antd'
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

import { PageHeader, DataTable } from '@/shared/components'
import type { TopicWithCount } from '../types'
import { useTopics, useDeleteTopic } from '../hooks/useTopic'
import { TopicFormModal } from '../components/TopicFormModal'

const { Text } = Typography

/**
 * TopicManagementPage - Admin interface for managing topics
 *
 * Features:
 * - Display list of all topics with question counts
 * - Create new topics
 * - Edit existing topics
 * - Delete topics with confirmation
 *
 * Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.7
 */
export default function TopicManagementPage() {
  const { data: topics = [], isLoading } = useTopics()
  const { mutate: deleteTopic, isPending: deleting } = useDeleteTopic()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingTopic, setEditingTopic] = useState<TopicWithCount | null>(null)

  const openCreate = () => {
    setEditingTopic(null)
    setModalOpen(true)
  }

  const openEdit = (record: TopicWithCount) => {
    setEditingTopic(record)
    setModalOpen(true)
  }

  const handleDelete = (id: string, _questionCount: number) => {
    deleteTopic(id)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setEditingTopic(null)
  }

  const columns: ColumnsType<TopicWithCount> = [
    {
      title: 'Tên chủ đề',
      dataIndex: 'name',
      render: (name: string, record) => (
        <Space direction="vertical" size={2}>
          <Text strong>{name}</Text>
          {record.description && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.description}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Số câu hỏi',
      dataIndex: 'questionCount',
      width: 120,
      render: (count: number) => <Tag color={count > 0 ? 'blue' : 'default'}>{count} câu hỏi</Tag>,
    },
    {
      title: '',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm
            title="Xóa chủ đề này?"
            description={
              record.questionCount > 0
                ? `Chủ đề này có ${record.questionCount} câu hỏi. Các câu hỏi sẽ không bị xóa, chỉ gỡ liên kết với chủ đề.`
                : 'Bạn có chắc chắn muốn xóa chủ đề này?'
            }
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(record.id, record.questionCount)}
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
        title="Quản lý chủ đề"
        description="Tạo và quản lý các chủ đề để phân loại câu hỏi"
        breadcrumbs={[{ label: 'Chủ đề' }]}
        extra={
          <Button type="primary" icon={<PlusOutlined />} size="large" onClick={openCreate}>
            Tạo chủ đề
          </Button>
        }
      />

      <DataTable
        dataSource={topics}
        columns={columns}
        rowKey="id"
        size="large"
        loading={isLoading}
      />

      <TopicFormModal open={modalOpen} topic={editingTopic} onClose={handleCloseModal} />
    </Space>
  )
}

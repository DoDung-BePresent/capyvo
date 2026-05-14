import { useState, useMemo } from 'react'
import { Button, Popconfirm, Space, Tag, Typography, Tabs } from 'antd'
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

import { PageHeader, DataTable } from '@/shared/components'
import type { TopicWithCount, PartNumber } from '../types'
import { PART_META } from '../types'
import { useTopics, useDeleteTopic } from '../hooks/useTopic'
import { TopicFormDrawer } from '../components/TopicFormDrawer'

const { Text } = Typography

/**
 * TopicManagementPage - Admin interface for managing topics
 *
 * Features:
 * - Display list of all topics with question counts
 * - Filter topics by part number
 * - Create new topics
 * - Edit existing topics
 * - Delete topics with confirmation
 *
 * Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.7
 */
export default function TopicManagementPage() {
  const [selectedPart, setSelectedPart] = useState<PartNumber | 'ALL'>('ALL')
  const { data: topics = [], isLoading } = useTopics(
    selectedPart === 'ALL' ? undefined : selectedPart,
  )
  const { mutate: deleteTopic, isPending: deleting } = useDeleteTopic()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingTopic, setEditingTopic] = useState<TopicWithCount | null>(null)

  // Count topics by part
  const topicCounts = useMemo(() => {
    const counts: Record<PartNumber | 'ALL', number> = {
      ALL: topics.length,
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    }
    topics.forEach((topic) => {
      counts[topic.partNumber as PartNumber]++
    })
    return counts
  }, [topics])

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
      title: 'Part',
      dataIndex: 'partNumber',
      width: 100,
      render: (partNumber: number) => {
        const meta = PART_META[partNumber as PartNumber]
        return (
          <Tag
            color={meta?.color}
            style={{
              fontWeight: 600,
              borderColor: meta?.color,
              backgroundColor: `${meta?.color}18`,
            }}
          >
            {meta?.label}
          </Tag>
        )
      },
    },
    {
      title: 'Số câu hỏi',
      dataIndex: 'questionCount',
      width: 120,
      render: (count: number) => <Tag color={count > 0 ? 'blue' : 'default'}>{count} câu hỏi</Tag>,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 120,
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

  const tabItems = [
    {
      key: 'ALL',
      label: `Tất cả (${topicCounts.ALL})`,
    },
    ...([1, 2, 3, 4, 5] as PartNumber[]).map((partNumber) => {
      const meta = PART_META[partNumber]
      return {
        key: String(partNumber),
        label: `${meta.label} (${topicCounts[partNumber]})`,
      }
    }),
  ]

  return (
    <Space direction="vertical" size={0} style={{ width: '100%' }}>
      <PageHeader
        title="Quản lý chủ đề"
        description="Tạo và quản lý các chủ đề để phân loại câu hỏi theo từng part"
        breadcrumbs={[{ label: 'Chủ đề' }]}
        extra={
          <Button type="primary" icon={<PlusOutlined />} size="large" onClick={openCreate}>
            Tạo chủ đề
          </Button>
        }
      />

      <div style={{ padding: '0 24px', background: '#fff' }}>
        <Tabs
          activeKey={String(selectedPart)}
          onChange={(key) => setSelectedPart(key === 'ALL' ? 'ALL' : (Number(key) as PartNumber))}
          items={tabItems}
          size="large"
        />
      </div>

      <DataTable
        noCard
        dataSource={topics}
        columns={columns}
        rowKey="id"
        size="large"
        loading={isLoading}
      />

      <TopicFormDrawer
        open={modalOpen}
        topic={editingTopic}
        defaultPartNumber={selectedPart === 'ALL' ? 1 : selectedPart}
        onClose={handleCloseModal}
      />
    </Space>
  )
}

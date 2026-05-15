import { Button, Dropdown, Image, Modal, Tag } from 'antd'
import type { MenuProps } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  DeleteOutlined,
  EditOutlined,
  SoundOutlined,
  MoreOutlined,
  CheckCircleOutlined,
  MinusCircleOutlined,
  InboxOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import type { QuestionSet } from '@/features/admin/types'
import { QuestionStatus } from '@/features/admin/types'
import { TypeTag } from './TypeTag'
import { StatusTag } from './StatusTag'
import { TopicTags } from './TopicTags'

// eslint-disable-next-line react-refresh/only-export-components
function AudioPlayer({ url }: { url: string }) {
  const showAudioModal = () => {
    Modal.info({
      title: 'Nghe audio',
      icon: null,
      width: 500,
      content: (
        <div style={{ width: '100%', marginTop: 16 }}>
          <audio controls style={{ width: '100%' }} autoPlay>
            <source src={url} type="audio/mpeg" />
          </audio>
        </div>
      ),
      okText: 'Đóng',
    })
  }

  return (
    <Button type="link" icon={<SoundOutlined />} onClick={showAudioModal} size="small">
      Nghe
    </Button>
  )
}

/**
 * Columns for Part 3 & 4 question sets
 */
 
export function getColumnsForSet(
  partNumber: 3 | 4,
  onView: (record: QuestionSet) => void,
  onEdit: (record: QuestionSet) => void,
  onDelete: (setId: string) => void,
  deleting: boolean,
  onUpdateStatus: (setId: string, status: QuestionStatus) => void,
): ColumnsType<QuestionSet> {
  const baseColumns: ColumnsType<QuestionSet> = [
    {
      title: 'No.',
      key: 'no',
      width: 60,
      render: (_: unknown, __: QuestionSet, index: number) => index + 1,
    },
  ]

  const actionsColumn: ColumnsType<QuestionSet>[number] = {
    title: 'Thao tác',
    key: 'actions',
    width: 100,
    fixed: 'right',
    render: (_: unknown, record: QuestionSet) => {
      const menuItems: MenuProps['items'] = [
        {
          key: 'view',
          label: 'Xem chi tiết',
          icon: <EyeOutlined style={{ fontSize: 14 }} />,
          onClick: () => onView(record),
        },
        {
          key: 'edit',
          label: 'Chỉnh sửa',
          icon: <EditOutlined style={{ fontSize: 14 }} />,
          onClick: () => onEdit(record),
        },
        {
          type: 'divider',
        },
        {
          key: 'publish',
          label: 'Xuất bản',
          icon: <CheckCircleOutlined style={{ fontSize: 14 }} />,
          disabled: record.status === QuestionStatus.PUBLISHED,
          onClick: () => onUpdateStatus(record.setId, QuestionStatus.PUBLISHED),
        },
        {
          key: 'unpublish',
          label: 'Bỏ xuất bản',
          icon: <MinusCircleOutlined style={{ fontSize: 14 }} />,
          disabled: record.status === QuestionStatus.DRAFT,
          onClick: () => onUpdateStatus(record.setId, QuestionStatus.DRAFT),
        },
        {
          key: 'archive',
          label: 'Lưu trữ',
          icon: <InboxOutlined style={{ fontSize: 14 }} />,
          disabled: record.status === QuestionStatus.ARCHIVED,
          onClick: () => onUpdateStatus(record.setId, QuestionStatus.ARCHIVED),
        },
        {
          type: 'divider',
        },
        {
          key: 'delete',
          label: 'Xóa',
          icon: <DeleteOutlined style={{ fontSize: 14 }} />,
          danger: true,
          onClick: () => {
            Modal.confirm({
              title: 'Xóa bộ câu hỏi này?',
              icon: <ExclamationCircleOutlined />,
              content: `Bạn có chắc chắn muốn xóa bộ ${record.questions.length} câu hỏi này? Hành động này không thể hoàn tác.`,
              okText: 'Xóa',
              okType: 'danger',
              cancelText: 'Hủy',
              onOk: () => onDelete(record.setId),
            })
          },
        },
      ]

      return (
        <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
          <Button type="text" icon={<MoreOutlined />} loading={deleting} />
        </Dropdown>
      )
    },
  }

  const typeColumn: ColumnsType<QuestionSet>[number] = {
    title: 'Loại',
    key: 'type',
    width: 100,
    render: (_: unknown, record: QuestionSet) => <TypeTag type={record.type} />,
  }

  const statusColumn: ColumnsType<QuestionSet>[number] = {
    title: 'Trạng thái',
    key: 'status',
    width: 110,
    render: (_: unknown, record: QuestionSet) => <StatusTag status={record.status} />,
  }

  const topicsColumn: ColumnsType<QuestionSet>[number] = {
    title: 'Chủ đề',
    key: 'topics',
    width: 200,
    render: (_: unknown, record: QuestionSet) => <TopicTags topics={record.topics || []} />,
  }

  if (partNumber === 3) {
    return [
      ...baseColumns,
      {
        title: 'Bối cảnh',
        dataIndex: 'contextText',
        ellipsis: true,
        width: 300,
      },
      {
        title: 'Audio bối cảnh',
        key: 'contextAudio',
        width: 120,
        render: (_: unknown, record: QuestionSet) => {
          if (!record.contextAudioUrl) return '—'
          return <AudioPlayer url={record.contextAudioUrl} />
        },
      },
      {
        title: 'Số câu hỏi',
        key: 'questionCount',
        width: 100,
        render: (_: unknown, record: QuestionSet) => (
          <Tag color="blue">{record.questions.length} câu</Tag>
        ),
      },
      typeColumn,
      statusColumn,
      topicsColumn,
      actionsColumn,
    ]
  }

  // Part 4
  return [
    ...baseColumns,
    {
      title: 'Ảnh',
      key: 'image',
      width: 100,
      render: (_: unknown, record: QuestionSet) =>
        record.imageUrls && record.imageUrls[0] ? (
          <Image src={record.imageUrls[0]} height={60} style={{ objectFit: 'cover' }} />
        ) : (
          '—'
        ),
    },
    {
      title: 'Bối cảnh',
      dataIndex: 'contextText',
      ellipsis: true,
      width: 250,
    },
    {
      title: 'Audio bối cảnh',
      key: 'contextAudio',
      width: 120,
      render: (_: unknown, record: QuestionSet) => {
        if (!record.contextAudioUrl) return '—'
        return <AudioPlayer url={record.contextAudioUrl} />
      },
    },
    {
      title: 'Số câu hỏi',
      key: 'questionCount',
      width: 100,
      render: (_: unknown, record: QuestionSet) => (
        <Tag color="blue">{record.questions.length} câu</Tag>
      ),
    },
    typeColumn,
    statusColumn,
    topicsColumn,
    actionsColumn,
  ]
}

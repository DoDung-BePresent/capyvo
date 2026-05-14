import { Button, Dropdown, Image, Typography } from 'antd'
import type { MenuProps } from 'antd'
import {
  DeleteOutlined,
  EditOutlined,
  SoundOutlined,
  MoreOutlined,
  CheckCircleOutlined,
  MinusCircleOutlined,
  InboxOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { PartNumber, QuestionWithTopics } from '@/features/admin/types'
import { QuestionType, QuestionStatus } from '@/features/admin/types'
import { TypeTag } from './TypeTag'
import { StatusTag } from './StatusTag'
import { TopicTags } from './TopicTags'

const { Text } = Typography

export function getColumns(
  partNumber: PartNumber,
  onEdit: (record: QuestionWithTopics) => void,
  onDelete: (id: string) => void,
  deleting: boolean,
  onUpdateStatus: (id: string, status: QuestionStatus) => void,
): ColumnsType<QuestionWithTopics> {
  const baseColumns: ColumnsType<QuestionWithTopics> = [
    {
      title: 'No.',
      key: 'no',
      width: 60,
      render: (_: unknown, __: QuestionWithTopics, index: number) => index + 1,
    },
  ]

  const actionsColumn: ColumnsType<QuestionWithTopics>[number] = {
    title: 'Thao tác',
    key: 'actions',
    width: 100,
    render: (_: unknown, record: QuestionWithTopics) => {
      const menuItems: MenuProps['items'] = [
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
          onClick: () => onUpdateStatus(record.id, QuestionStatus.PUBLISHED),
        },
        {
          key: 'unpublish',
          label: 'Bỏ xuất bản',
          icon: <MinusCircleOutlined style={{ fontSize: 14 }} />,
          disabled: record.status === QuestionStatus.DRAFT,
          onClick: () => onUpdateStatus(record.id, QuestionStatus.DRAFT),
        },
        {
          key: 'archive',
          label: 'Lưu trữ',
          icon: <InboxOutlined style={{ fontSize: 14 }} />,
          disabled: record.status === QuestionStatus.ARCHIVED,
          onClick: () => onUpdateStatus(record.id, QuestionStatus.ARCHIVED),
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
            if (window.confirm('Bạn có chắc chắn muốn xóa câu hỏi này?')) {
              onDelete(record.id)
            }
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

  // Common columns for type, status, and topics
  const typeColumn: ColumnsType<QuestionWithTopics>[number] = {
    title: 'Loại',
    key: 'type',
    width: 100,
    render: (_: unknown, record: QuestionWithTopics) => (
      <TypeTag type={record.type || QuestionType.PRACTICE} />
    ),
  }

  const statusColumn: ColumnsType<QuestionWithTopics>[number] = {
    title: 'Trạng thái',
    key: 'status',
    width: 110,
    render: (_: unknown, record: QuestionWithTopics) => (
      <StatusTag status={record.status || QuestionStatus.DRAFT} />
    ),
  }

  const topicsColumn: ColumnsType<QuestionWithTopics>[number] = {
    title: 'Chủ đề',
    key: 'topics',
    width: 200,
    render: (_: unknown, record: QuestionWithTopics) => <TopicTags topics={record.topics || []} />,
  }

  if (partNumber === 1) {
    return [
      ...baseColumns,
      { title: 'Nội dung đọc', dataIndex: 'contentText', ellipsis: true },
      {
        title: 'Thời gian',
        render: (_, r) => (
          <Text type="secondary">
            {r.prepTimeSeconds}s / {r.responseTimeSeconds}s
          </Text>
        ),
        width: 120,
      },
      typeColumn,
      statusColumn,
      topicsColumn,
      actionsColumn,
    ]
  }

  if (partNumber === 2) {
    return [
      ...baseColumns,
      {
        title: 'Hình ảnh',
        dataIndex: 'imageUrls',
        render: (urls: string[]) =>
          urls[0] ? <Image src={urls[0]} height={60} style={{ objectFit: 'cover' }} /> : '—',
        width: 100,
      },
      typeColumn,
      statusColumn,
      topicsColumn,
      actionsColumn,
    ]
  }

  if (partNumber === 3) {
    return [
      ...baseColumns,
      { title: 'Bối cảnh', dataIndex: 'contextText', ellipsis: true },
      { title: 'Câu hỏi', dataIndex: 'questionText', ellipsis: true },
      {
        title: 'Audio',
        render: (_: unknown, r: QuestionWithTopics) =>
          r.questionAudioUrl ? (
            <a href={r.questionAudioUrl} target="_blank" rel="noreferrer">
              <SoundOutlined /> Nghe
            </a>
          ) : (
            '—'
          ),
        width: 90,
      },
      typeColumn,
      statusColumn,
      topicsColumn,
      actionsColumn,
    ]
  }

  if (partNumber === 4) {
    return [
      ...baseColumns,
      {
        title: 'Ảnh',
        dataIndex: 'imageUrls',
        render: (urls: string[]) =>
          urls[0] ? <Image src={urls[0]} height={50} style={{ objectFit: 'cover' }} /> : '—',
        width: 80,
      },
      { title: 'Câu hỏi', dataIndex: 'questionText', ellipsis: true },
      {
        title: 'Audio',
        render: (_: unknown, r: QuestionWithTopics) =>
          r.questionAudioUrl ? (
            <a href={r.questionAudioUrl} target="_blank" rel="noreferrer">
              <SoundOutlined /> Nghe
            </a>
          ) : (
            '—'
          ),
        width: 90,
      },
      typeColumn,
      statusColumn,
      topicsColumn,
      actionsColumn,
    ]
  }

  return [
    ...baseColumns,
    { title: 'Câu hỏi', dataIndex: 'questionText', ellipsis: true },
    {
      title: 'Audio',
      render: (_: unknown, r: QuestionWithTopics) =>
        r.questionAudioUrl ? (
          <a href={r.questionAudioUrl} target="_blank" rel="noreferrer">
            <SoundOutlined /> Nghe
          </a>
        ) : (
          '—'
        ),
      width: 90,
    },
    typeColumn,
    statusColumn,
    topicsColumn,
    actionsColumn,
  ]
}

import { Button, Space, Popconfirm, Image, Checkbox, Typography } from 'antd'
import { DeleteOutlined, EditOutlined, SoundOutlined } from '@ant-design/icons'
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
  selectedIds: string[],
  onSelectChange: (id: string, checked: boolean) => void,
): ColumnsType<QuestionWithTopics> {
  const checkboxColumn: ColumnsType<QuestionWithTopics>[number] = {
    title: (
      <Checkbox
        indeterminate={
          selectedIds.length > 0 &&
          selectedIds.length <
            (partNumber === 1
              ? 2
              : partNumber === 2
                ? 2
                : partNumber === 3
                  ? 3
                  : partNumber === 4
                    ? 3
                    : 1)
        }
        checked={selectedIds.length > 0}
        onChange={() => {
          // This will be handled by the parent component
        }}
      />
    ),
    key: 'select',
    width: 50,
    render: (_: unknown, record: QuestionWithTopics) => (
      <Checkbox
        checked={selectedIds.includes(record.id)}
        onChange={(_e) => onSelectChange(record.id, _e.target.checked)}
      />
    ),
  }

  const baseColumns: ColumnsType<QuestionWithTopics> = [
    checkboxColumn,
    {
      title: 'No.',
      key: 'no',
      width: 60,
      render: (_: unknown, __: QuestionWithTopics, index: number) => index + 1,
    },
  ]

  const actionsColumn: ColumnsType<QuestionWithTopics>[number] = {
    title: '',
    key: 'actions',
    width: 90,
    render: (_: unknown, record: QuestionWithTopics) => (
      <Space size={4}>
        <Button type="text" icon={<EditOutlined />} onClick={() => onEdit(record)} />
        <Popconfirm
          title="Xóa câu hỏi này?"
          okText="Xóa"
          cancelText="Hủy"
          okButtonProps={{ danger: true }}
          onConfirm={() => onDelete(record.id)}
        >
          <Button type="text" danger icon={<DeleteOutlined />} loading={deleting} />
        </Popconfirm>
      </Space>
    ),
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

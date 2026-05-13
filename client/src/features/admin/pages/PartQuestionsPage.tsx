import { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import {
  Typography,
  Button,
  Space,
  Popconfirm,
  Image,
  Empty,
  Form,
  Drawer,
  Tabs,
  Tag,
  Checkbox,
} from 'antd'

/**
 * Icons
 */
import { DeleteOutlined, EditOutlined, PlusOutlined, SoundOutlined } from '@ant-design/icons'

/**
 * Types
 */
import type { FormInstance } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PART_META, QuestionType, QuestionStatus } from '../types'
import type { PartNumber, UpdateQuestionPayload, QuestionWithTopics } from '../types'
import type {
  Part1FormValues,
  Part2FormValues,
  Part3FormValues,
  Part4FormValues,
  Part5FormValues,
} from '../types'

/**
 * Components
 */
import { PageHeader, DataTable } from '@/shared/components'
import Part1Form from '../components/Part1Form'
import Part2Form from '../components/Part2Form'
import Part3Form from '../components/Part3Form'
import Part4Form from '../components/Part4Form'
import Part5Form from '../components/Part5Form'
import EditQuestionForm from '../components/EditQuestionForm'
import QuestionFilters from '../components/QuestionFilters'
import BulkActionsToolbar from '../components/BulkActionsToolbar'

/**
 * Hooks
 */
import {
  useQuestions,
  useCreatePart1,
  useCreatePart2,
  useCreatePart3,
  useCreatePart4,
  useCreatePart5,
  useDeleteQuestion,
  useUpdateQuestion,
} from '../hooks/useQuestion'
import { useTopics } from '../hooks/useTopic'

/**
 * Configs
 */
import { DRAWER_WIDTHS } from '@/config'

const { Text } = Typography

// ─── Tag Components ─── //
function TypeTag({ type }: { type: QuestionType }) {
  const colorMap: Record<QuestionType, string> = {
    [QuestionType.PRACTICE]: 'blue',
    [QuestionType.FORECAST]: 'orange',
    [QuestionType.CUSTOM]: 'purple',
  }
  return <Tag color={colorMap[type]}>{type}</Tag>
}

function StatusTag({ status }: { status: QuestionStatus }) {
  const colorMap: Record<QuestionStatus, string> = {
    [QuestionStatus.DRAFT]: 'default',
    [QuestionStatus.PUBLISHED]: 'green',
    [QuestionStatus.ARCHIVED]: 'red',
  }
  return <Tag color={colorMap[status]}>{status}</Tag>
}

function TopicTags({ topics }: { topics: Array<{ id: string; name: string }> }) {
  if (!topics || topics.length === 0) {
    return <Text type="secondary">—</Text>
  }
  return (
    <Space size={4} wrap>
      {topics.map((topic) => (
        <Tag key={topic.id}>{topic.name}</Tag>
      ))}
    </Space>
  )
}

// ─── Column definitions ─── //
function getColumns(
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

// ─── Part form renderer (no mutations, no buttons) ─── //
function PartFormContent({
  partNumber,
  form,
  onSubmit,
}: {
  partNumber: PartNumber
  form: FormInstance
  onSubmit: (values: unknown) => void
}) {
  switch (partNumber) {
    case 1:
      return <Part1Form form={form} onSubmit={onSubmit as (v: Part1FormValues) => void} />
    case 2:
      return <Part2Form form={form} onSubmit={onSubmit as (v: Part2FormValues) => void} />
    case 3:
      return <Part3Form form={form} onSubmit={onSubmit as (v: Part3FormValues) => void} />
    case 4:
      return <Part4Form form={form} onSubmit={onSubmit as (v: Part4FormValues) => void} />
    default:
      return <Part5Form form={form} onSubmit={onSubmit as (v: Part5FormValues) => void} />
  }
}

// ─── Submit label per part ─── //
const SUBMIT_LABEL: Record<PartNumber, string> = {
  1: 'Lưu câu hỏi',
  2: 'Lưu câu hỏi',
  3: 'Tạo 3 câu + Gen audio',
  4: 'Tạo 3 câu + Gen audio',
  5: 'Tạo câu + Gen audio',
}

// ─── Page ─── //
export default function PartQuestionsPage() {
  const { partNumber: partParam } = useParams<{ partNumber: string }>()
  const partNumber = Number(partParam) as PartNumber

  // Drawer states
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editDrawerOpen, setEditDrawerOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<QuestionWithTopics | null>(null)

  // Filter states
  const [type, setType] = useState<QuestionType | 'ALL'>('ALL')
  const [status, setStatus] = useState<QuestionStatus | 'ALL'>('ALL')
  const [topicId, setTopicId] = useState<string | undefined>(undefined)
  const [search, setSearch] = useState('')

  // Selection state
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([])

  // Forms
  const [drawerForm] = Form.useForm()
  const [editForm] = Form.useForm()

  // Active question number for tabs
  const [activeQNum, setActiveQNum] = useState<number>(
    () => PART_META[partNumber]?.questionNumbers[0] ?? 1,
  )
  const [prevPartNumber, setPrevPartNumber] = useState(partNumber)

  // Reset filters when part changes
  if (prevPartNumber !== partNumber) {
    setPrevPartNumber(partNumber)
    setActiveQNum(PART_META[partNumber]?.questionNumbers[0] ?? 1)
    setSearch('')
    setType('ALL')
    setStatus('ALL')
    setTopicId(undefined)
    setSelectedQuestionIds([])
  }

  // Build filter object for useQuestions hook
  const filters = useMemo(() => {
    const f: {
      partNumber: number
      type?: QuestionType
      status?: QuestionStatus
      topicId?: string
      search?: string
    } = { partNumber }

    if (type !== 'ALL') f.type = type
    if (status !== 'ALL') f.status = status
    if (topicId) f.topicId = topicId
    if (search) f.search = search

    return f
  }, [partNumber, type, status, topicId, search])

  // Fetch data
  const { data: questions = [], isLoading } = useQuestions(filters)
  const { data: topics = [] } = useTopics()
  const { mutate: deleteQuestion, isPending: deleting } = useDeleteQuestion(partNumber)
  const updateQuestion = useUpdateQuestion(partNumber)

  const createPart1 = useCreatePart1()
  const createPart2 = useCreatePart2()
  const createPart3 = useCreatePart3()
  const createPart4 = useCreatePart4()
  const createPart5 = useCreatePart5()

  const isPendingMap: Record<PartNumber, boolean> = {
    1: createPart1.isPending,
    2: createPart2.isPending,
    3: createPart3.isPending,
    4: createPart4.isPending,
    5: createPart5.isPending,
  }

  // Calculate filter counts
  const filterCounts = useMemo(() => {
    const allQuestions = questions as QuestionWithTopics[]
    const total = allQuestions.length

    const byType: Record<QuestionType | 'ALL', number> = {
      ALL: total,
      [QuestionType.PRACTICE]: allQuestions.filter((q) => q.type === QuestionType.PRACTICE).length,
      [QuestionType.FORECAST]: allQuestions.filter((q) => q.type === QuestionType.FORECAST).length,
      [QuestionType.CUSTOM]: allQuestions.filter((q) => q.type === QuestionType.CUSTOM).length,
    }

    const byStatus: Record<QuestionStatus | 'ALL', number> = {
      ALL: total,
      [QuestionStatus.DRAFT]: allQuestions.filter((q) => q.status === QuestionStatus.DRAFT).length,
      [QuestionStatus.PUBLISHED]: allQuestions.filter((q) => q.status === QuestionStatus.PUBLISHED)
        .length,
      [QuestionStatus.ARCHIVED]: allQuestions.filter((q) => q.status === QuestionStatus.ARCHIVED)
        .length,
    }

    return { total, byType, byStatus }
  }, [questions])

  // Handle selection
  const handleSelectChange = (id: string, checked: boolean) => {
    setSelectedQuestionIds((prev) => (checked ? [...prev, id] : prev.filter((qid) => qid !== id)))
  }

  const handleClearSelection = () => {
    setSelectedQuestionIds([])
  }

  const handleFormFinish = (values: unknown) => {
    const onSuccess = () => {
      drawerForm.resetFields()
      setDrawerOpen(false)
    }
    switch (partNumber) {
      case 1:
        createPart1.mutate(values as Part1FormValues, { onSuccess })
        break
      case 2:
        createPart2.mutate(values as Part2FormValues, { onSuccess })
        break
      case 3:
        createPart3.mutate(values as Part3FormValues, { onSuccess })
        break
      case 4:
        createPart4.mutate(values as Part4FormValues, { onSuccess })
        break
      case 5:
        createPart5.mutate(values as Part5FormValues, { onSuccess })
        break
    }
  }

  function openEditDrawer(question: QuestionWithTopics) {
    setEditingQuestion(question)
    setEditDrawerOpen(true)
    setTimeout(() => {
      if (partNumber === 1) {
        editForm.setFieldsValue({ contentText: question.contentText ?? '' })
      } else if (partNumber === 2) {
        editForm.setFieldsValue({
          imageUrl: question.imageUrls[0] ?? '',
          imageContext: question.imageContext ?? '',
        })
      } else if (partNumber === 3) {
        editForm.setFieldsValue({
          contextText: question.contextText ?? '',
          contextAudioUrl: question.contextAudioUrl ?? undefined,
          questionText: question.questionText ?? '',
          questionAudioUrl: question.questionAudioUrl ?? undefined,
        })
      } else if (partNumber === 4) {
        editForm.setFieldsValue({
          imageUrl: question.imageUrls[0] ?? '',
          imageContext: question.imageContext ?? '',
          contextText: question.contextText ?? '',
          contextAudioUrl: question.contextAudioUrl ?? undefined,
          questionText: question.questionText ?? '',
          questionAudioUrl: question.questionAudioUrl ?? undefined,
        })
      } else {
        editForm.setFieldsValue({
          questionText: question.questionText ?? '',
          questionAudioUrl: question.questionAudioUrl ?? undefined,
        })
      }
    }, 0)
  }

  function closeEditDrawer() {
    editForm.resetFields()
    setEditDrawerOpen(false)
    setEditingQuestion(null)
  }

  const handleEditFormFinish = (values: unknown) => {
    if (!editingQuestion) return
    const id = editingQuestion.id
    let payload: UpdateQuestionPayload = {}

    if (partNumber === 1) {
      const v = values as { contentText: string }
      payload = { contentText: v.contentText }
    } else if (partNumber === 2) {
      const v = values as { imageUrl: string; imageContext?: string }
      payload = { imageUrls: [v.imageUrl], imageContext: v.imageContext ?? null }
    } else if (partNumber === 3) {
      const v = values as {
        contextText: string
        contextAudioUrl?: string
        questionText: string
        questionAudioUrl?: string
      }
      payload = {
        contextText: v.contextText,
        contextAudioUrl: v.contextAudioUrl ?? null,
        questionText: v.questionText,
        questionAudioUrl: v.questionAudioUrl ?? null,
      }
    } else if (partNumber === 4) {
      const v = values as {
        imageUrl: string
        imageContext?: string
        contextText: string
        contextAudioUrl?: string
        questionText: string
        questionAudioUrl?: string
      }
      payload = {
        imageUrls: [v.imageUrl],
        imageContext: v.imageContext ?? null,
        contextText: v.contextText,
        contextAudioUrl: v.contextAudioUrl ?? null,
        questionText: v.questionText,
        questionAudioUrl: v.questionAudioUrl ?? null,
      }
    } else {
      const v = values as { questionText: string; questionAudioUrl?: string }
      payload = {
        questionText: v.questionText,
        questionAudioUrl: v.questionAudioUrl ?? null,
      }
    }

    updateQuestion.mutate({ id, payload }, { onSuccess: closeEditDrawer })
  }

  const meta = PART_META[partNumber]

  if (!meta) {
    return <Empty description="Part không hợp lệ" />
  }

  const questionNumbers = [...meta.questionNumbers]
  const columns = getColumns(
    partNumber,
    openEditDrawer,
    deleteQuestion,
    deleting,
    selectedQuestionIds,
    handleSelectChange,
  )

  const responseTimeText =
    'responseTimeOverride' in meta
      ? `${meta.responseTime}s (câu cuối ${Object.values(meta.responseTimeOverride as Record<number, number>)[0]}s)`
      : `${meta.responseTime}s`

  const getFilteredData = (qNum: number): QuestionWithTopics[] =>
    (questions as QuestionWithTopics[]).filter((q) => q.questionNumber === qNum)

  return (
    <Space vertical size={0} style={{ width: '100%' }}>
      <PageHeader
        title={`${meta.label} — ${meta.description}`}
        description={`Prep: ${meta.prepTime}s | Response: ${responseTimeText}`}
        breadcrumbs={[{ label: 'Câu hỏi', href: '/admin/questions' }, { label: meta.label }]}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={() => setDrawerOpen(true)}
          >
            Thêm câu hỏi
          </Button>
        }
      />

      {/* Question Filters */}
      <div style={{ padding: '24px', marginBottom: '20px', background: '#fff' }}>
        <QuestionFilters
          type={type}
          status={status}
          topicId={topicId}
          search={search}
          onTypeChange={setType}
          onStatusChange={setStatus}
          onTopicChange={setTopicId}
          onSearchChange={setSearch}
          topics={topics}
          counts={filterCounts}
        />
      </div>

      {/* Bulk Actions Toolbar */}
      <div style={{ padding: '0 24px' }}>
        <BulkActionsToolbar
          selectedQuestionIds={selectedQuestionIds}
          onClearSelection={handleClearSelection}
        />
      </div>

      {/* Question Table with Tabs */}
      {questionNumbers.length > 1 ? (
        <Tabs
          type="card"
          size="large"
          activeKey={String(activeQNum)}
          onChange={(k) => setActiveQNum(Number(k))}
          tabBarStyle={{ marginBottom: 0 }}
          items={questionNumbers.map((n) => ({
            key: String(n),
            label: `Câu ${n}`,
            children: (
              <DataTable
                noCard
                dataSource={getFilteredData(n)}
                columns={columns}
                rowKey="id"
                size="large"
                loading={isLoading}
                locale={{ emptyText: <Empty description="Chưa có câu hỏi nào" /> }}
                pagination={{
                  pageSize: 50,
                  showSizeChanger: true,
                  showTotal: (total) => `Tổng ${total} câu hỏi`,
                  pageSizeOptions: ['20', '50', '100'],
                }}
              />
            ),
          }))}
        />
      ) : (
        <DataTable
          dataSource={getFilteredData(questionNumbers[0])}
          columns={columns}
          rowKey="id"
          size="large"
          loading={isLoading}
          locale={{ emptyText: <Empty description="Chưa có câu hỏi nào" /> }}
          pagination={{
            pageSize: 50,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} câu hỏi`,
            pageSizeOptions: ['20', '50', '100'],
          }}
        />
      )}

      <Drawer
        title="Thêm câu hỏi mới"
        placement="right"
        width={DRAWER_WIDTHS.medium}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        destroyOnHidden
        closeIcon={null}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button size="large" onClick={() => drawerForm.resetFields()}>
              Xóa
            </Button>
            <Button
              type="primary"
              size="large"
              loading={isPendingMap[partNumber]}
              onClick={() => drawerForm.submit()}
            >
              {SUBMIT_LABEL[partNumber]}
            </Button>
          </div>
        }
      >
        <PartFormContent partNumber={partNumber} form={drawerForm} onSubmit={handleFormFinish} />
      </Drawer>

      <Drawer
        title="Chỉnh sửa câu hỏi"
        placement="right"
        width={DRAWER_WIDTHS.medium}
        open={editDrawerOpen}
        onClose={closeEditDrawer}
        destroyOnHidden
        closeIcon={null}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button size="large" onClick={closeEditDrawer}>
              Hủy
            </Button>
            <Button
              type="primary"
              size="large"
              loading={updateQuestion.isPending}
              onClick={() => editForm.submit()}
            >
              Lưu thay đổi
            </Button>
          </div>
        }
      >
        <EditQuestionForm partNumber={partNumber} form={editForm} onSubmit={handleEditFormFinish} />
      </Drawer>
    </Space>
  )
}

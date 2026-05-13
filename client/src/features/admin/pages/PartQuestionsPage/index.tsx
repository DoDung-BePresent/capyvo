import { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { Button, Space, Empty, Form, Drawer, Tabs } from 'antd'
import { PlusOutlined } from '@ant-design/icons'

import type { PartNumber, UpdateQuestionPayload, QuestionWithTopics } from '@/features/admin/types'
import type {
  Part1FormValues,
  Part2FormValues,
  Part3FormValues,
  Part4FormValues,
  Part5FormValues,
} from '@/features/admin/types'
import { PART_META, QuestionType, QuestionStatus } from '@/features/admin/types'

import { PageHeader, DataTable } from '@/shared/components'
import EditQuestionForm from '@/features/admin/components/EditQuestionForm'
import QuestionFilters from '@/features/admin/components/QuestionFilters'
import BulkActionsToolbar from '@/features/admin/components/BulkActionsToolbar'

import {
  useQuestions,
  useCreatePart1,
  useCreatePart2,
  useCreatePart3,
  useCreatePart4,
  useCreatePart5,
  useDeleteQuestion,
  useUpdateQuestion,
} from '@/features/admin/hooks/useQuestion'
import { useTopics } from '@/features/admin/hooks/useTopic'

import { DRAWER_WIDTHS } from '@/config'

import { getColumns } from './components/getColumns'
import { PartFormContent } from './components/PartFormContent'
import { SUBMIT_LABEL } from './constants'

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
      <div style={{ padding: '24px', marginBottom: '24px', background: '#fff' }}>
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
        <div>
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
        </div>
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

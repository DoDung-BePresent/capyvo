import { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { Button, Space, Empty, Form, Drawer, Tabs, Descriptions, Typography, Divider } from 'antd'
import { PlusOutlined } from '@ant-design/icons'

import type {
  PartNumber,
  QuestionWithTopics,
  QuestionSet,
  UpdateQuestionPayload,
} from '@/features/admin/types'
import type {
  Part1FormValues,
  Part2FormValues,
  Part3FormValues,
  Part4FormValues,
  Part5FormValues,
} from '@/features/admin/types'
import { PART_META, QuestionType, QuestionStatus } from '@/features/admin/types'

import { PageHeader, DataTable } from '@/shared/components'
import QuestionFilters from '@/features/admin/components/QuestionFilters'

import {
  useQuestionsGrouped,
  useCreatePart1,
  useCreatePart2,
  useCreatePart3,
  useCreatePart4,
  useCreatePart5,
  useDeleteQuestion,
  useDeleteQuestionSet,
  useUpdateQuestion,
  useUpdateQuestionSet,
  useUpdateQuestionStatus,
} from '@/features/admin/hooks/useQuestion'
import { useTopics } from '@/features/admin/hooks/useTopic'

import { DRAWER_WIDTHS } from '@/config'

import { getColumns } from './components/getColumns'
import { getColumnsForSet } from './components/getColumnsForSet'
import { PartFormContent } from './components/PartFormContent'
import { SUBMIT_LABEL } from './constants'

const { Text } = Typography

export default function PartQuestionsPage() {
  const { partNumber: partParam } = useParams<{ partNumber: string }>()
  const partNumber = Number(partParam) as PartNumber

  // Drawer states
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editDrawerOpen, setEditDrawerOpen] = useState(false)
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<QuestionWithTopics | null>(null)
  const [editingSet, setEditingSet] = useState<QuestionSet | null>(null)
  const [viewingSet, setViewingSet] = useState<QuestionSet | null>(null)

  // Filter states
  const [type, setType] = useState<QuestionType | 'ALL'>('ALL')
  const [status, setStatus] = useState<QuestionStatus | 'ALL'>('ALL')
  const [topicId, setTopicId] = useState<string | undefined>(undefined)
  const [search, setSearch] = useState('')

  // Active question number for tabs (Part 1 & 2 only)
  const [activeQNum, setActiveQNum] = useState<number>(
    () => PART_META[partNumber]?.questionNumbers[0] ?? 1,
  )

  // Forms
  const [drawerForm] = Form.useForm()
  const [editForm] = Form.useForm()

  const [prevPartNumber, setPrevPartNumber] = useState(partNumber)

  // Reset filters when part changes
  if (prevPartNumber !== partNumber) {
    setPrevPartNumber(partNumber)
    setActiveQNum(PART_META[partNumber]?.questionNumbers[0] ?? 1)
    setSearch('')
    setType('ALL')
    setStatus('ALL')
    setTopicId(undefined)
  }

  // Build filter object for useQuestionsGrouped hook
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

  // Fetch data using new grouped API
  const { data: questionsData = [], isLoading } = useQuestionsGrouped(filters)
  const { data: topics = [] } = useTopics(partNumber)
  const deleteQuestion = useDeleteQuestion(partNumber)
  const deleteQuestionSet = useDeleteQuestionSet(partNumber)
  const updateQuestion = useUpdateQuestion(partNumber)
  const updateQuestionSet = useUpdateQuestionSet(partNumber)
  const { mutate: updateStatus } = useUpdateQuestionStatus()

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

  // Determine if we're working with sets (Part 3 & 4) or individual questions
  const isSetMode = partNumber === 3 || partNumber === 4

  const questions = useMemo(
    () => (isSetMode ? [] : (questionsData as QuestionWithTopics[])),
    [isSetMode, questionsData],
  )

  const questionSets = useMemo(
    () => (isSetMode ? (questionsData as QuestionSet[]) : []),
    [isSetMode, questionsData],
  )

  // Calculate filter counts
  const filterCounts = useMemo(() => {
    if (isSetMode) {
      const total = questionSets.length
      const byType: Record<QuestionType | 'ALL', number> = {
        ALL: total,
        [QuestionType.PRACTICE]: questionSets.filter((s) => s.type === QuestionType.PRACTICE)
          .length,
        [QuestionType.FORECAST]: questionSets.filter((s) => s.type === QuestionType.FORECAST)
          .length,
        [QuestionType.CUSTOM]: questionSets.filter((s) => s.type === QuestionType.CUSTOM).length,
      }
      const byStatus: Record<QuestionStatus | 'ALL', number> = {
        ALL: total,
        [QuestionStatus.DRAFT]: questionSets.filter((s) => s.status === QuestionStatus.DRAFT)
          .length,
        [QuestionStatus.PUBLISHED]: questionSets.filter(
          (s) => s.status === QuestionStatus.PUBLISHED,
        ).length,
        [QuestionStatus.ARCHIVED]: questionSets.filter((s) => s.status === QuestionStatus.ARCHIVED)
          .length,
      }
      return { total, byType, byStatus }
    } else {
      const total = questions.length
      const byType: Record<QuestionType | 'ALL', number> = {
        ALL: total,
        [QuestionType.PRACTICE]: questions.filter((q) => q.type === QuestionType.PRACTICE).length,
        [QuestionType.FORECAST]: questions.filter((q) => q.type === QuestionType.FORECAST).length,
        [QuestionType.CUSTOM]: questions.filter((q) => q.type === QuestionType.CUSTOM).length,
      }
      const byStatus: Record<QuestionStatus | 'ALL', number> = {
        ALL: total,
        [QuestionStatus.DRAFT]: questions.filter((q) => q.status === QuestionStatus.DRAFT).length,
        [QuestionStatus.PUBLISHED]: questions.filter((q) => q.status === QuestionStatus.PUBLISHED)
          .length,
        [QuestionStatus.ARCHIVED]: questions.filter((q) => q.status === QuestionStatus.ARCHIVED)
          .length,
      }
      return { total, byType, byStatus }
    }
  }, [isSetMode, questions, questionSets])

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

  // Edit handlers for individual questions (Part 1, 2, 5)
  function openEditDrawer(question: QuestionWithTopics) {
    setEditingQuestion(question)
    setEditDrawerOpen(true)
    setTimeout(() => {
      if (partNumber === 1) {
        editForm.setFieldsValue({
          questionNumber: question.questionNumber as 1 | 2,
          contentText: question.contentText ?? '',
          type: question.type,
          status: question.status,
          topicIds: question.topics?.map((t) => t.id) ?? [],
        })
      } else if (partNumber === 2) {
        editForm.setFieldsValue({
          questionNumber: question.questionNumber as 3 | 4,
          imageUrl: question.imageUrls[0] ?? '',
          imageContext: question.imageContext ?? '',
          type: question.type,
          status: question.status,
          topicIds: question.topics?.map((t) => t.id) ?? [],
        })
      } else {
        editForm.setFieldsValue({
          questionText: question.questionText ?? '',
          questionAudioUrl: question.questionAudioUrl ?? undefined,
          type: question.type,
          status: question.status,
          topicIds: question.topics?.map((t) => t.id) ?? [],
        })
      }
    }, 0)
  }

  // Edit handlers for question sets (Part 3, 4)
  function openEditSetDrawer(set: QuestionSet) {
    setEditingSet(set)
    setEditDrawerOpen(true)
    setTimeout(() => {
      if (partNumber === 3) {
        const q5 = set.questions.find((q) => q.questionNumber === 5)
        const q6 = set.questions.find((q) => q.questionNumber === 6)
        const q7 = set.questions.find((q) => q.questionNumber === 7)
        editForm.setFieldsValue({
          contextText: set.contextText ?? '',
          contextAudioUrl: set.contextAudioUrl ?? undefined,
          q5: q5?.questionText ?? '',
          q5AudioUrl: q5?.questionAudioUrl ?? undefined,
          q6: q6?.questionText ?? '',
          q6AudioUrl: q6?.questionAudioUrl ?? undefined,
          q7: q7?.questionText ?? '',
          q7AudioUrl: q7?.questionAudioUrl ?? undefined,
          type: set.type,
          status: set.status,
          topicIds: set.topics?.map((t) => t.id) ?? [],
        })
      } else if (partNumber === 4) {
        const q8 = set.questions.find((q) => q.questionNumber === 8)
        const q9 = set.questions.find((q) => q.questionNumber === 9)
        const q10 = set.questions.find((q) => q.questionNumber === 10)
        editForm.setFieldsValue({
          imageUrl: set.imageUrls?.[0] ?? '',
          imageContext: set.imageContext ?? '',
          contextText: set.contextText ?? '',
          contextAudioUrl: set.contextAudioUrl ?? undefined,
          q8: q8?.questionText ?? '',
          q8AudioUrl: q8?.questionAudioUrl ?? undefined,
          q9: q9?.questionText ?? '',
          q9AudioUrl: q9?.questionAudioUrl ?? undefined,
          q10: q10?.questionText ?? '',
          q10AudioUrl: q10?.questionAudioUrl ?? undefined,
          type: set.type,
          status: set.status,
          topicIds: set.topics?.map((t) => t.id) ?? [],
        })
      }
    }, 0)
  }

  // View handler for question sets (Part 3, 4)
  function openViewSetDrawer(set: QuestionSet) {
    setViewingSet(set)
    setViewDrawerOpen(true)
  }

  function closeViewDrawer() {
    setViewDrawerOpen(false)
    setViewingSet(null)
  }

  function closeEditDrawer() {
    editForm.resetFields()
    setEditDrawerOpen(false)
    setEditingQuestion(null)
    setEditingSet(null)
  }

  const handleEditFormFinish = (values: unknown) => {
    const onSuccess = () => {
      editForm.resetFields()
      setEditDrawerOpen(false)
      setEditingQuestion(null)
      setEditingSet(null)
    }

    // For Part 3 & 4 sets
    if (editingSet) {
      if (partNumber === 3) {
        updateQuestionSet.mutate(
          { setId: editingSet.setId, payload: values as Part3FormValues },
          { onSuccess },
        )
      } else if (partNumber === 4) {
        updateQuestionSet.mutate(
          { setId: editingSet.setId, payload: values as Part4FormValues },
          { onSuccess },
        )
      }
      return
    }

    // For individual questions (Part 1, 2, 5)
    if (!editingQuestion) return

    let payload: UpdateQuestionPayload

    if (partNumber === 1) {
      const formValues = values as Part1FormValues
      payload = {
        contentText: formValues.contentText,
        type: formValues.type,
        status: formValues.status,
        topicIds: formValues.topicIds,
      }
    } else if (partNumber === 2) {
      const formValues = values as Part2FormValues
      payload = {
        imageUrls: [formValues.imageUrl],
        imageContext: formValues.imageContext ?? null,
        type: formValues.type,
        status: formValues.status,
        topicIds: formValues.topicIds,
      }
    } else {
      const formValues = values as Part5FormValues
      payload = {
        questionText: formValues.questionText,
        questionAudioUrl: formValues.questionAudioUrl ?? null,
        type: formValues.type,
        status: formValues.status,
        topicIds: formValues.topicIds,
      }
    }

    updateQuestion.mutate({ id: editingQuestion.id, payload }, { onSuccess })
  }

  const handleUpdateStatus = (id: string, status: QuestionStatus) => {
    updateStatus({ id, status })
  }

  const handleUpdateSetStatus = (setId: string, status: QuestionStatus) => {
    // Update all questions in the set
    const set = questionSets.find((s) => s.setId === setId)
    if (!set) return

    set.questions.forEach((q) => {
      updateStatus({ id: q.id, status })
    })
  }

  const handleDeleteSet = (setId: string) => {
    deleteQuestionSet.mutate(setId)
  }

  const meta = PART_META[partNumber]

  if (!meta) {
    return <Empty description="Part không hợp lệ" />
  }

  const responseTimeText =
    'responseTimeOverride' in meta
      ? `${meta.responseTime}s (câu cuối ${Object.values(meta.responseTimeOverride as Record<number, number>)[0]}s)`
      : `${meta.responseTime}s`

  // For Part 1 & 2: Filter by active question number
  const shouldShowTabs = partNumber === 1 || partNumber === 2
  const questionNumbers = [...meta.questionNumbers]

  const getFilteredData = (qNum: number): QuestionWithTopics[] =>
    (questions as QuestionWithTopics[]).filter((q) => q.questionNumber === qNum)

  return (
    <Space direction="vertical" size={0} style={{ width: '100%' }}>
      <PageHeader
        title={`${meta.label} — ${meta.description}`}
        description={`Prep: ${meta.prepTime}s | Response: ${responseTimeText}`}
        breadcrumbs={[{ label: 'Câu hỏi', href: '/admin/questions' }, { label: meta.label }]}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={() => {
              drawerForm.resetFields()
              // Set default values for create form
              if (partNumber === 1) {
                drawerForm.setFieldsValue({ questionNumber: 1 })
              } else if (partNumber === 2) {
                drawerForm.setFieldsValue({ questionNumber: 3 })
              }
              setDrawerOpen(true)
            }}
          >
            Thêm câu hỏi
          </Button>
        }
      />

      {/* Question Filters */}
      <div style={{ padding: 24, background: '#fff' }}>
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

      {/* Question Table - Conditional rendering based on mode */}
      {isSetMode ? (
        <DataTable
          dataSource={questionSets}
          columns={getColumnsForSet(
            partNumber as 3 | 4,
            openViewSetDrawer,
            openEditSetDrawer,
            handleDeleteSet,
            deleteQuestionSet.isPending,
            handleUpdateSetStatus,
          )}
          rowKey="setId"
          size="large"
          loading={isLoading}
          locale={{ emptyText: <Empty description="Chưa có câu hỏi nào" /> }}
          pagination={{
            pageSize: 50,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} bộ câu hỏi`,
            pageSizeOptions: ['20', '50', '100'],
          }}
          scroll={{ x: 1400 }}
        />
      ) : shouldShowTabs ? (
        // Part 1 & 2: Show tabs for different question numbers
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
                columns={getColumns(
                  partNumber,
                  openEditDrawer,
                  (id: string) => deleteQuestion.mutate(id),
                  deleteQuestion.isPending,
                  handleUpdateStatus,
                )}
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
        // Part 5: No tabs, single table
        <DataTable
          dataSource={questions}
          columns={getColumns(
            partNumber,
            openEditDrawer,
            (id: string) => deleteQuestion.mutate(id),
            deleteQuestion.isPending,
            handleUpdateStatus,
          )}
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
          scroll={{ x: 1400 }}
        />
      )}

      <Drawer
        closeIcon={null}
        title="Thêm câu hỏi mới"
        placement="right"
        width={DRAWER_WIDTHS.medium}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        destroyOnHidden
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
        title={isSetMode ? 'Chỉnh sửa bộ câu hỏi' : 'Chỉnh sửa câu hỏi'}
        placement="right"
        width={DRAWER_WIDTHS.medium}
        open={editDrawerOpen}
        onClose={closeEditDrawer}
        destroyOnHidden
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button size="large" onClick={closeEditDrawer}>
              Hủy
            </Button>
            <Button
              type="primary"
              size="large"
              loading={isSetMode ? updateQuestionSet.isPending : updateQuestion.isPending}
              onClick={() => editForm.submit()}
            >
              Lưu thay đổi
            </Button>
          </div>
        }
      >
        <PartFormContent partNumber={partNumber} form={editForm} onSubmit={handleEditFormFinish} />
      </Drawer>

      {/* View Drawer for Question Sets (Part 3 & 4) */}
      {viewingSet && (
        <Drawer
          closeIcon={null}
          title="Chi tiết bộ câu hỏi"
          placement="right"
          width={DRAWER_WIDTHS.medium}
          open={viewDrawerOpen}
          onClose={closeViewDrawer}
          destroyOnHidden
        >
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Context Information */}
            <div>
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="Bối cảnh">
                  {viewingSet.contextText || '—'}
                </Descriptions.Item>
                {viewingSet.imageUrls && viewingSet.imageUrls[0] && (
                  <Descriptions.Item label="Hình ảnh">
                    <img
                      src={viewingSet.imageUrls[0]}
                      alt="Context"
                      style={{ maxWidth: '100%', height: 'auto' }}
                    />
                  </Descriptions.Item>
                )}
                {viewingSet.imageContext && (
                  <Descriptions.Item label="Mô tả ảnh">{viewingSet.imageContext}</Descriptions.Item>
                )}
                {viewingSet.contextAudioUrl && (
                  <Descriptions.Item label="Audio bối cảnh">
                    <audio controls style={{ width: '100%' }}>
                      <source src={viewingSet.contextAudioUrl} type="audio/mpeg" />
                    </audio>
                  </Descriptions.Item>
                )}
              </Descriptions>
            </div>

            <Divider>Câu hỏi</Divider>

            {/* Questions */}
            {viewingSet.questions.map((q) => (
              <div key={q.id}>
                <Text strong style={{ fontSize: 16 }}>
                  Câu {q.questionNumber}
                </Text>
                <Descriptions column={1} bordered size="small" style={{ marginTop: 8 }}>
                  <Descriptions.Item label="Nội dung">{q.questionText}</Descriptions.Item>
                  {q.questionAudioUrl && (
                    <Descriptions.Item label="Audio">
                      <audio controls style={{ width: '100%' }}>
                        <source src={q.questionAudioUrl} type="audio/mpeg" />
                      </audio>
                    </Descriptions.Item>
                  )}
                  <Descriptions.Item label="Thời gian">
                    Prep: {q.prepTimeSeconds}s | Response: {q.responseTimeSeconds}s
                  </Descriptions.Item>
                </Descriptions>
              </div>
            ))}
          </Space>
        </Drawer>
      )}
    </Space>
  )
}

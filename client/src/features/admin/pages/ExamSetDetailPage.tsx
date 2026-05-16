import { useState } from 'react'
import * as React from 'react'
import { useParams } from 'react-router-dom'
import {
  Button,
  Card,
  Drawer,
  Empty,
  Flex,
  Image,
  Input,
  Popconfirm,
  Radio,
  Segmented,
  Skeleton,
  Space,
  Switch,
  Tag,
  Typography,
} from 'antd'
import {
  CheckOutlined,
  LinkOutlined,
  SearchOutlined,
  SoundOutlined,
  SwapOutlined,
} from '@ant-design/icons'

import { PageHeader } from '@/shared/components'
import { DRAWER_WIDTHS } from '@/config'
import { PART_META } from '../types'
import type { Question } from '../types'
import {
  useGetExamSet,
  useUpdateExamSet,
  useAssignQuestion,
  useUnassignQuestion,
  useGetPoolQuestions,
} from '../hooks/useExamSet'

const { Text, Paragraph } = Typography

// ─── Slot row ─── //
function QuestionSlot({
  questionNumber,
  question,
  onAssign,
  onUnassign,
  unassignPending: isPending,
}: {
  questionNumber: number
  question: Question | undefined
  onAssign: (questionNumber: number) => void
  onUnassign: (question: Question) => void
  unassignPending: boolean
}) {
  const partNumber = Object.entries(PART_META).find(([, meta]) =>
    meta.questionNumbers.includes(questionNumber as never),
  )?.[0]

  const color = partNumber ? PART_META[Number(partNumber) as keyof typeof PART_META].color : '#999'

  return (
    <Flex
      align="center"
      gap={12}
      style={{
        padding: '12px 16px',
        borderBottom: '1px solid #f0f0f0',
      }}
    >
      <Tag
        style={{
          minWidth: 52,
          textAlign: 'center',
          fontWeight: 600,
          borderColor: color,
          color,
          backgroundColor: `${color}18`,
        }}
      >
        Câu {questionNumber}
      </Tag>

      <div style={{ flex: 1, minWidth: 0 }}>
        {question ? (
          <Space direction="vertical" size={2} style={{ width: '100%' }}>
            {question.contentText && (
              <Paragraph ellipsis={{ rows: 1 }} style={{ margin: 0 }}>
                {question.contentText}
              </Paragraph>
            )}
            {question.questionText && (
              <Paragraph ellipsis={{ rows: 1 }} style={{ margin: 0 }}>
                {question.questionText}
              </Paragraph>
            )}
            {question.imageUrls?.[0] && (
              <Image
                src={question.imageUrls[0]}
                height={48}
                style={{ objectFit: 'cover', borderRadius: 4 }}
              />
            )}
            {question.questionAudioUrl && (
              <a href={question.questionAudioUrl} target="_blank" rel="noreferrer">
                <SoundOutlined /> Audio
              </a>
            )}
          </Space>
        ) : (
          <Text type="secondary" style={{ fontStyle: 'italic' }}>
            Chưa có câu hỏi
          </Text>
        )}
      </div>

      {question ? (
        <Space>
          <Button size="small" icon={<SwapOutlined />} onClick={() => onAssign(questionNumber)}>
            Đổi
          </Button>
          <Popconfirm
            title="Gỡ câu hỏi này khỏi bộ đề?"
            okText="Gỡ"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
            onConfirm={() => onUnassign(question)}
          >
            <Button size="small" danger loading={isPending}>
              Gỡ
            </Button>
          </Popconfirm>
        </Space>
      ) : (
        <Button size="small" type="primary" onClick={() => onAssign(questionNumber)}>
          Gán câu
        </Button>
      )}
    </Flex>
  )
}

// ─── Assign drawer ─── //
function AssignDrawer({
  open,
  questionNumber,
  currentExamSetId,
  onClose,
}: {
  open: boolean
  questionNumber: number
  currentExamSetId: string
  onClose: () => void
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [searchText, setSearchText] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [assignmentFilter, setAssignmentFilter] = useState<'all' | 'assigned' | 'unassigned'>('all')

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchText])

  const { data: pool = [], isLoading } = useGetPoolQuestions(
    questionNumber,
    open,
    debouncedSearch || undefined,
    assignmentFilter,
  )
  const { mutate: assign, isPending } = useAssignQuestion(currentExamSetId)

  const handleConfirm = () => {
    if (!selectedId) return
    assign(selectedId, {
      onSuccess: () => {
        setSelectedId(null)
        onClose()
      },
    })
  }

  return (
    <Drawer
      title={`Chọn câu hỏi — Câu ${questionNumber}`}
      placement="right"
      width={DRAWER_WIDTHS.medium}
      open={open}
      onClose={onClose}
      destroyOnHidden
      closeIcon={null}
      footer={
        <Flex justify="flex-end" gap={8}>
          <Button size="large" onClick={onClose}>
            Hủy
          </Button>
          <Button
            type="primary"
            size="large"
            icon={<CheckOutlined />}
            disabled={!selectedId}
            loading={isPending}
            onClick={handleConfirm}
          >
            Gán câu này
          </Button>
        </Flex>
      }
    >
      {/* Search and Filter Controls */}
      <Space direction="vertical" size={12} style={{ width: '100%', marginBottom: 16 }}>
        <Input
          placeholder="Tìm kiếm nội dung câu hỏi..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
          size="large"
        />
        <Segmented
          value={assignmentFilter}
          onChange={(value) => setAssignmentFilter(value as 'all' | 'assigned' | 'unassigned')}
          options={[
            { label: 'Tất cả', value: 'all' },
            { label: 'Đã gán', value: 'assigned' },
            { label: 'Chưa gán', value: 'unassigned' },
          ]}
          block
          size="large"
        />
      </Space>

      {isLoading ? (
        <Skeleton active />
      ) : pool.length === 0 ? (
        <Empty
          description={
            searchText || assignmentFilter !== 'all'
              ? 'Không tìm thấy câu hỏi phù hợp'
              : 'Chưa có câu hỏi nào cho slot này'
          }
        />
      ) : (
        <Radio.Group
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value as string)}
          style={{ width: '100%' }}
        >
          <Space direction="vertical" style={{ width: '100%' }} size={8}>
            {pool.map((q) => {
              const isSelected = selectedId === q.id
              // Check if question is assigned to current exam set
              const assignedHere = q.examSets?.some((s) => s.id === currentExamSetId) ?? false
              // Check if question is assigned to other exam sets
              const otherExamSets = q.examSets?.filter((s) => s.id !== currentExamSetId) ?? []
              const assignedElsewhere = otherExamSets.length > 0

              return (
                <Radio
                  key={q.id}
                  value={q.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    width: '100%',
                    padding: '12px 14px',
                    border: `1.5px solid ${
                      isSelected ? '#4F46E5' : assignedElsewhere ? '#fa8c16' : '#e8e8e8'
                    }`,
                    borderRadius: 8,
                    backgroundColor: isSelected ? '#f0f0ff' : assignedHere ? '#f6ffed' : '#fff',
                  }}
                >
                  <Space direction="vertical" size={6} style={{ flex: 1, marginLeft: 8 }}>
                    {/* Assignment badges */}
                    <Flex align="center" gap={6} wrap="wrap">
                      {assignedHere && (
                        <Tag color="green" icon={<CheckOutlined />}>
                          Bộ đề này
                        </Tag>
                      )}
                      {otherExamSets.map((set) => (
                        <Tag key={set.id} color="blue" icon={<LinkOutlined />}>
                          {set.title}
                        </Tag>
                      ))}
                      {!assignedHere && otherExamSets.length === 0 && (
                        <Tag color="default">Chưa gán</Tag>
                      )}
                    </Flex>

                    {/* Content */}
                    {q.contentText && <Text>{q.contentText}</Text>}
                    {q.questionText && <Text>{q.questionText}</Text>}
                    {q.imageUrls?.[0] && (
                      <Image
                        src={q.imageUrls[0]}
                        height={56}
                        style={{ objectFit: 'cover', borderRadius: 4 }}
                        preview={false}
                      />
                    )}
                    {q.questionAudioUrl && (
                      <a
                        href={q.questionAudioUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <SoundOutlined /> Nghe audio
                      </a>
                    )}
                  </Space>
                </Radio>
              )
            })}
          </Space>
        </Radio.Group>
      )}
    </Drawer>
  )
}

// ─── Page ─── //
export default function ExamSetDetailPage() {
  const { id } = useParams<{ id: string }>()

  const { data: examSet, isLoading } = useGetExamSet(id ?? '')
  const updateMutation = useUpdateExamSet(id ?? '')
  const { mutate: unassign, isPending: unassigning } = useUnassignQuestion(id ?? '')

  const [assignDrawerQNum, setAssignDrawerQNum] = useState<number | null>(null)

  if (isLoading) return <Skeleton active style={{ padding: 24 }} />
  if (!examSet) return <Empty description="Không tìm thấy bộ đề" />

  const questionMap = new Map(examSet.questions.map((q) => [q.questionNumber, q]))

  return (
    <Space direction="vertical" size={0} style={{ width: '100%' }}>
      <PageHeader
        title={examSet.title}
        description={examSet.description ?? undefined}
        breadcrumbs={[{ label: 'Bộ đề', href: '/admin/exam-sets' }, { label: examSet.title }]}
        extra={
          <Space>
            <Text type="secondary">Xuất bản</Text>
            <Switch
              checked={examSet.isPublished}
              loading={updateMutation.isPending}
              disabled={!examSet.isComplete}
              onChange={(checked) => updateMutation.mutate({ isPublished: checked })}
            />
            {!examSet.isComplete && (
              <Text type="warning" style={{ fontSize: 12 }}>
                (Cần đủ 11 câu)
              </Text>
            )}
          </Space>
        }
      />

      <Card
        title={
          <Flex align="center" gap={8}>
            <Text strong>11 câu hỏi</Text>
            <Tag color="blue">{examSet.questions.length} / 11 đã gán</Tag>
          </Flex>
        }
        styles={{ body: { padding: 0 } }}
      >
        {Object.entries(PART_META).map(([pNum, meta]) => (
          <div key={pNum}>
            <Flex
              align="center"
              style={{
                padding: '8px 16px',
                backgroundColor: '#fafafa',
                borderBottom: '1px solid #f0f0f0',
              }}
            >
              <Text strong style={{ color: meta.color, fontSize: 13 }}>
                {meta.label} — {meta.description}
              </Text>
            </Flex>
            {meta.questionNumbers.map((qNum) => (
              <QuestionSlot
                key={qNum}
                questionNumber={qNum}
                question={questionMap.get(qNum)}
                onAssign={setAssignDrawerQNum}
                onUnassign={(q) => unassign(q.id)}
                unassignPending={unassigning}
              />
            ))}
          </div>
        ))}
      </Card>

      <AssignDrawer
        open={assignDrawerQNum !== null}
        questionNumber={assignDrawerQNum ?? 1}
        currentExamSetId={id ?? ''}
        onClose={() => setAssignDrawerQNum(null)}
      />
    </Space>
  )
}

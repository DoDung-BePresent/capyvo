import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Button,
  Card,
  Empty,
  Flex,
  Image,
  Modal,
  Popconfirm,
  Radio,
  Skeleton,
  Space,
  Switch,
  Tag,
  Typography,
} from 'antd'
import { ArrowLeftOutlined, CheckOutlined, SoundOutlined, SwapOutlined } from '@ant-design/icons'

import { PageHeader } from '@/shared/components'
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

// ─── Pool modal ─── //
function AssignModal({
  open,
  questionNumber,
  examSetId,
  onClose,
}: {
  open: boolean
  questionNumber: number
  examSetId: string
  onClose: () => void
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { data: pool = [], isLoading } = useGetPoolQuestions(questionNumber, open)
  const { mutate: assign, isPending } = useAssignQuestion(examSetId)

  const handleOk = () => {
    if (!selectedId) return
    assign(selectedId, { onSuccess: onClose })
  }

  return (
    <Modal
      title={`Chọn câu hỏi cho Câu ${questionNumber}`}
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      okText="Gán câu"
      okButtonProps={{ disabled: !selectedId, loading: isPending, icon: <CheckOutlined /> }}
      cancelText="Hủy"
      width={680}
      afterClose={() => setSelectedId(null)}
    >
      {isLoading ? (
        <Skeleton active />
      ) : pool.length === 0 ? (
        <Empty description="Không có câu hỏi chưa được gán trong pool" />
      ) : (
        <Radio.Group
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value as string)}
          style={{ width: '100%' }}
        >
          <Space direction="vertical" style={{ width: '100%' }} size={8}>
            {pool.map((q) => (
              <Radio
                key={q.id}
                value={q.id}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${selectedId === q.id ? '#4F46E5' : '#e8e8e8'}`,
                  borderRadius: 6,
                  backgroundColor: selectedId === q.id ? '#f0f0ff' : '#fff',
                }}
              >
                <Space direction="vertical" size={4} style={{ marginLeft: 8 }}>
                  {q.contentText && <Text>{q.contentText}</Text>}
                  {q.questionText && <Text>{q.questionText}</Text>}
                  {q.imageUrls?.[0] && (
                    <Image
                      src={q.imageUrls[0]}
                      height={48}
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
                      <SoundOutlined /> Audio
                    </a>
                  )}
                </Space>
              </Radio>
            ))}
          </Space>
        </Radio.Group>
      )}
    </Modal>
  )
}

// ─── Page ─── //
export default function ExamSetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: examSet, isLoading } = useGetExamSet(id ?? '')
  const updateMutation = useUpdateExamSet(id ?? '')
  const { mutate: unassign, isPending: unassigning } = useUnassignQuestion(id ?? '')

  const [assignModalQNum, setAssignModalQNum] = useState<number | null>(null)

  if (isLoading) return <Skeleton active style={{ padding: 24 }} />
  if (!examSet) return <Empty description="Không tìm thấy bộ đề" />

  const questionMap = new Map(examSet.questions.map((q) => [q.questionNumber, q]))

  const allQuestionNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <PageHeader
        title={examSet.title}
        description={examSet.description ?? undefined}
        breadcrumbs={[{ label: 'Bộ đề', href: '/admin/exam-sets' }, { label: examSet.title }]}
        extra={
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/exam-sets')}>
              Quay lại
            </Button>
            <Space>
              <Text type="secondary">Xuất bản</Text>
              <Switch
                checked={examSet.isPublished}
                loading={updateMutation.isPending}
                onChange={(checked) => updateMutation.mutate({ isPublished: checked })}
              />
            </Space>
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
                onAssign={setAssignModalQNum}
                onUnassign={(q) => unassign(q.id)}
                unassignPending={unassigning}
              />
            ))}
          </div>
        ))}

        {/* Ensure all 11 are covered — Part 5 Q11 */}
        {!allQuestionNumbers.every((n) =>
          Object.values(PART_META)
            .flatMap((m) => [...m.questionNumbers])
            .includes(n as never),
        ) && null}
      </Card>

      {assignModalQNum !== null && (
        <AssignModal
          open
          questionNumber={assignModalQNum}
          examSetId={id ?? ''}
          onClose={() => setAssignModalQNum(null)}
        />
      )}
    </Space>
  )
}

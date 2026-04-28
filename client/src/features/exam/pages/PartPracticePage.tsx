import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Empty, Flex, Spin, Typography, Button, Tag } from 'antd'
import { PlayCircle } from '@mui/icons-material'
import { styled } from '@/shared/utils/cn'
import { usePartQuestions, usePartExamSets } from '@/features/exam/hooks/usePartQuestions'
import { PART_META } from '@/features/admin/types'
import type { PartNumber, Question } from '@/features/admin/types'
import { PageHeader } from '@/shared/components'

const { Text, Title } = Typography

// Styled components
const Container = styled('div', 'flex gap-6 h-[calc(100vh-200px)]')
const Sidebar = styled('div', 'w-64 shrink-0 overflow-y-auto')
const MainContent = styled('div', 'flex-1 overflow-y-auto')
const FilterCard = styled(Card, 'mb-4 rounded-lg! cursor-pointer')
const QuestionCard = styled(Card, 'h-full rounded-lg! hover:shadow-lg transition-all')
const QuestionGrid = styled('div', 'grid grid-cols-1 gap-4')

interface FilterItemProps {
  id: string
  title: string
  questionCount: number
  isActive: boolean
  onClick: () => void
}

function FilterItem({ title, questionCount, isActive, onClick }: FilterItemProps) {
  return (
    <FilterCard
      onClick={onClick}
      style={{
        backgroundColor: isActive ? '#f0f5ff' : 'white',
      }}
      styles={{ body: { padding: '12px 16px' } }}
    >
      <Flex vertical gap={8}>
        <Text strong style={{ fontSize: 14 }}>
          {title}
        </Text>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {questionCount} câu hỏi
        </Text>
      </Flex>
    </FilterCard>
  )
}

interface QuestionItemProps {
  question: Question & { examSetId: string; examSetTitle: string }
  onPractice: () => void
}

function QuestionItem({ question, onPractice }: QuestionItemProps) {
  const getQuestionPreview = () => {
    if (question.contentText) return question.contentText
    if (question.questionText) return question.questionText
    if (question.contextText) return question.contextText
    return 'Câu hỏi thực hành'
  }

  return (
    <QuestionCard styles={{ body: { padding: '20px' } }}>
      <Flex vertical gap={12} style={{ height: '100%' }}>
        <Flex align="center" justify="space-between">
          <Tag color="blue">Câu {question.questionNumber}</Tag>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {question.prepTimeSeconds}s • {question.responseTimeSeconds}s
          </Text>
        </Flex>

        <div style={{ flex: 1 }}>
          <Text type="secondary" style={{ fontSize: 12, marginBottom: 8, display: 'block' }}>
            {question.examSetTitle}
          </Text>
          <Text
            style={{
              fontSize: 14,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {getQuestionPreview()}
          </Text>
        </div>

        {question.imageUrls && question.imageUrls.length > 0 && (
          <Tag color="purple" style={{ width: 'fit-content' }}>
            Có hình ảnh
          </Tag>
        )}

        <Button
          type="primary"
          icon={<PlayCircle style={{ fontSize: 18 }} />}
          onClick={onPractice}
          style={{ width: '100%' }}
        >
          Luyện tập
        </Button>
      </Flex>
    </QuestionCard>
  )
}

export default function PartPracticePage() {
  const { partNumber } = useParams<{ partNumber: string }>()
  const navigate = useNavigate()
  const part = Number(partNumber) as PartNumber
  const meta = PART_META[part]

  const [selectedSetId, setSelectedSetId] = useState<string | null>(null)

  // Fetch all questions
  const { data: allQuestions = [], isLoading: questionsLoading } = usePartQuestions(part)

  // Fetch exam sets for filter
  const { data: examSets = [], isLoading: setsLoading } = usePartExamSets(part)

  const isLoading = questionsLoading || setsLoading

  // Filter questions by selected set
  const filteredQuestions = selectedSetId
    ? allQuestions.filter((q) => q.examSetId === selectedSetId)
    : allQuestions

  const selectedSet = examSets.find((s) => s.id === selectedSetId)

  const handlePracticeQuestion = (question: Question & { examSetId: string }) => {
    navigate(`/practice/part/${part}/set/${question.examSetId}/exam`, {
      state: { startFromQuestion: question.questionNumber },
    })
  }

  if (isLoading) {
    return (
      <>
        <PageHeader
          title={`Luyện ${meta?.label ?? ''}`}
          description={meta?.description}
          breadcrumbs={[
            { label: 'Luyện theo Part', href: '/practice' },
            { label: meta?.label ?? '' },
          ]}
        />
        <Flex justify="center" style={{ padding: '48px 0' }}>
          <Spin size="large" />
        </Flex>
      </>
    )
  }

  if (examSets.length === 0) {
    return (
      <>
        <PageHeader
          title={`Luyện ${meta?.label ?? ''}`}
          description={meta?.description}
          breadcrumbs={[
            { label: 'Luyện theo Part', href: '/practice' },
            { label: meta?.label ?? '' },
          ]}
        />
        <Empty
          description="Chưa có bộ đề nào được công bố cho phần này"
          style={{ marginTop: 48 }}
        />
      </>
    )
  }

  return (
    <>
      <PageHeader
        title={`Luyện ${meta?.label ?? ''}`}
        description={meta?.description}
        breadcrumbs={[
          { label: 'Luyện theo Part', href: '/practice' },
          { label: meta?.label ?? '' },
        ]}
      />

      <Container>
        {/* Sidebar - Filter by exam set */}
        <Sidebar>
          <Title level={5} style={{ marginBottom: 16 }}>
            Bộ đề
          </Title>

          {examSets.map((set) => (
            <FilterItem
              key={set.id}
              id={set.id}
              title={set.title}
              questionCount={set.questionCount}
              isActive={selectedSetId === set.id}
              onClick={() => setSelectedSetId(set.id)}
            />
          ))}
        </Sidebar>

        {/* Main content - Questions grid */}
        <MainContent>
          <Flex align="center" justify="space-between" style={{ marginBottom: 16 }}>
            <Title level={5} style={{ margin: 0 }}>
              {selectedSet ? selectedSet.title : 'Chọn bộ đề'}
            </Title>
            <Text type="secondary">{filteredQuestions.length} câu hỏi</Text>
          </Flex>

          {!selectedSetId ? (
            <Empty description="Chọn một bộ đề để xem câu hỏi" />
          ) : filteredQuestions.length === 0 ? (
            <Empty description="Không có câu hỏi nào" />
          ) : (
            <QuestionGrid>
              {filteredQuestions.map((question) => (
                <QuestionItem
                  key={question.id}
                  question={question}
                  onPractice={() => handlePracticeQuestion(question)}
                />
              ))}
            </QuestionGrid>
          )}
        </MainContent>
      </Container>
    </>
  )
}

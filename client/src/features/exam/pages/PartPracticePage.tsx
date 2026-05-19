/**
 * Hooks
 */
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

/**
 * Components
 */
import { PageHeader } from '@/shared/components'
import { StyledButton } from '@/shared/components'
import { Card, Empty, Flex, Spin, Typography, Tag } from 'antd'
import { TopicFilter } from '@/features/exam/components/TopicFilter'
import SimpleBar from 'simplebar-react'
import 'simplebar-react/dist/simplebar.min.css'

/**
 * Icons
 */
import { PlayCircle } from '@mui/icons-material'

/**
 * Utils
 */
import { styled } from '@/shared/utils/cn'
import { hexToRgba } from '@/shared/utils/color'

/**
 * Types
 */
import { PART_META } from '@/shared/types/domain'
import type { PartNumber } from '@/shared/types/domain'
import { questionService } from '@/features/exam/services/question.service'
import type { QuestionWithTopics } from '@/features/exam/services/question.service'

/**
 * Constants
 */
import { COLORS } from '@/shared/constants/user-color'

const { Text, Title } = Typography

// Styled components
const Container = styled('div', 'flex gap-6 h-[calc(100vh-200px)]')
const Sidebar = styled('div', 'w-64 shrink-0')
const MainContent = styled('div', 'flex-1')
const QuestionCard = styled(Card, 'h-full rounded-lg! hover:shadow-lg transition-all')
const QuestionGrid = styled('div', 'grid gap-4')

interface QuestionItemProps {
  question: QuestionWithTopics
  onPractice: () => void
  partNumber: number
}

function QuestionItem({ question, onPractice, partNumber }: QuestionItemProps) {
  const getQuestionPreview = () => {
    // Part 4: Show questionText (not contextText) below image
    if (partNumber === 4 && question.questionText) {
      return question.questionText
    }
    // Part 2: Show imageContext or contentText
    if (partNumber === 2) {
      return
    }
    // Other parts: Show contentText, questionText, or contextText
    if (question.contentText) return question.contentText
    if (question.questionText) return question.questionText
    if (question.contextText) return question.contextText
  }

  const imageUrl =
    question.imageUrls && question.imageUrls.length > 0 ? question.imageUrls[0] : null
  const hasImages = partNumber === 2 || partNumber === 4

  return (
    <QuestionCard styles={{ body: { padding: '20px' } }}>
      <Flex vertical gap={12} style={{ height: '100%' }}>
        <Flex align="center" justify="space-between">
          <Tag color="blue">Câu {question.questionNumber}</Tag>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {question.prepTimeSeconds}s • {question.responseTimeSeconds}s
          </Text>
        </Flex>

        {/* Display image if available and part has images */}
        {hasImages && imageUrl && (
          <div
            style={{
              width: '100%',
              height: 250,
              borderRadius: 8,
              overflow: 'hidden',
              backgroundColor: '#f0f0f0',
            }}
          >
            <img
              src={imageUrl}
              alt="Question"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </div>
        )}

        <div style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 14,
              display: '-webkit-box',
              WebkitLineClamp: hasImages ? 2 : 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {getQuestionPreview()}
          </Text>
        </div>

        {/* Display topic tags */}
        {question.topics && question.topics.length > 0 && (
          <Flex gap={4} wrap="wrap">
            {question.topics.map((topic) => (
              <Tag key={topic.id} color="green" style={{ margin: 0 }}>
                {topic.name}
              </Tag>
            ))}
          </Flex>
        )}

        <StyledButton
          size="large"
          type="primary"
          icon={<PlayCircle style={{ fontSize: 18 }} />}
          onClick={onPractice}
          shadowColor={hexToRgba(COLORS.primary, 0.6)}
          style={{
            width: '100%',
            backgroundColor: COLORS.primary,
            borderColor: COLORS.primary,
          }}
        >
          Luyện tập
        </StyledButton>
      </Flex>
    </QuestionCard>
  )
}

export default function PartPracticePage() {
  const { partNumber } = useParams<{ partNumber: string }>()
  const navigate = useNavigate()
  const part = Number(partNumber) as PartNumber
  const meta = PART_META[part]

  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null)

  // Fetch all questions with topic filtering support
  const {
    data: allQuestions = [],
    isLoading: questionsLoading,
    isFetching: questionsFetching,
  } = useQuery({
    queryKey: ['questions', 'part', part, 'all', selectedTopicId],
    queryFn: () => questionService.getByPart(part, selectedTopicId ?? undefined),
    enabled: !!part && part >= 1 && part <= 5,
  })

  // Fetch topics for filter
  const { data: topics = [], isLoading: topicsLoading } = useQuery({
    queryKey: ['questions', 'part', part, 'topics'],
    queryFn: () => questionService.getTopicsByPart(part),
    enabled: !!part && part >= 1 && part <= 5,
  })

  const isLoading = questionsLoading || topicsLoading
  const isInitialLoading = isLoading && !topics.length

  const selectedTopic = topics.find((t) => t.id === selectedTopicId)

  // Determine if current part has images (Part 2 and Part 4)
  const hasImages = part === 2 || part === 4
  const gridCols = hasImages ? 'grid-cols-2' : 'grid-cols-1'

  const handlePracticeQuestion = (question: QuestionWithTopics) => {
    navigate(`/practice/part/${part}/question/${question.id}`)
  }

  const handleTopicSelect = (topicId: string | null) => {
    setSelectedTopicId(topicId)
  }

  if (isInitialLoading) {
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

  // Show empty state if no topics
  if (topics.length === 0) {
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
          description="Chưa có câu hỏi nào được công bố cho phần này"
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
        {/* Sidebar - Filter by topic */}
        <Sidebar>
          <SimpleBar style={{ maxHeight: 'calc(100vh - 200px)' }}>
            {/* Topic Filter Section */}
            {topics.length > 0 && (
              <>
                <Title level={5} style={{ marginBottom: 16 }}>
                  Chủ đề
                </Title>
                <TopicFilter
                  topics={topics}
                  selectedTopicId={selectedTopicId}
                  onSelectTopic={handleTopicSelect}
                />
              </>
            )}
          </SimpleBar>
        </Sidebar>

        {/* Main content - Questions grid */}
        <MainContent>
          <SimpleBar style={{ maxHeight: 'calc(100vh - 200px)' }}>
            <Flex align="center" justify="space-between" style={{ marginBottom: 16 }}>
              <Title level={5} style={{ margin: 0 }}>
                {selectedTopic ? selectedTopic.name : 'Tất cả câu hỏi'}
              </Title>
              <Flex align="center" gap={8}>
                {questionsFetching && <Spin size="small" />}
                <Text type="secondary">{allQuestions.length} câu hỏi</Text>
              </Flex>
            </Flex>

            {allQuestions.length === 0 ? (
              <Empty description="Không có câu hỏi nào phù hợp với bộ lọc" />
            ) : (
              <QuestionGrid className={gridCols}>
                {allQuestions.map((question) => (
                  <QuestionItem
                    key={question.id}
                    question={question}
                    onPractice={() => handlePracticeQuestion(question)}
                    partNumber={part}
                  />
                ))}
              </QuestionGrid>
            )}
          </SimpleBar>
        </MainContent>
      </Container>
    </>
  )
}

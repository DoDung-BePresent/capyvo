/**
 * TopicFilter Component
 *
 * Displays topics alphabetically with question counts for filtering practice questions.
 * Shows "All Questions" option and highlights selected topic.
 * Filters out topics with zero questions.
 *
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6
 */

import { Card, Flex, Typography } from 'antd'
import { styled } from '@/shared/utils/cn'
import { hexToRgba } from '@/shared/utils/color'
import { COLORS } from '@/shared/constants/user-color'
import type { TopicWithCount } from '@/features/exam/services/question.service'

const { Text } = Typography

// Styled components
const FilterCard = styled(Card, 'mb-4 rounded-lg! cursor-pointer')

interface TopicFilterProps {
  topics: TopicWithCount[]
  selectedTopicId: string | null
  onSelectTopic: (topicId: string | null) => void
}

interface FilterItemProps {
  id: string | null
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
        backgroundColor: isActive ? hexToRgba(COLORS.primary, 0.1) : 'white',
        borderWidth: isActive ? 2 : 0,
        borderColor: isActive ? COLORS.primary : undefined,
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

/**
 * TopicFilter Component
 *
 * Displays topics for filtering practice questions by topic.
 * Topics are sorted alphabetically and show question counts.
 * Topics with zero questions are filtered out.
 */
export function TopicFilter({ topics, selectedTopicId, onSelectTopic }: TopicFilterProps) {
  // Filter out topics with zero questions (Requirement 11.4)
  const topicsWithQuestions = topics.filter((topic) => topic.questionCount > 0)

  // Sort topics alphabetically by name (Requirement 11.5)
  const sortedTopics = [...topicsWithQuestions].sort((a, b) =>
    a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' }),
  )

  // Calculate total question count for "All Questions" option
  const totalQuestions = topicsWithQuestions.reduce((sum, topic) => sum + topic.questionCount, 0)

  return (
    <div className="flex flex-col gap-2">
      {/* All Questions option (Requirement 11.3, 11.6) */}
      <FilterItem
        id={null}
        title="Tất cả câu hỏi"
        questionCount={totalQuestions}
        isActive={selectedTopicId === null}
        onClick={() => onSelectTopic(null)}
      />

      {/* Topic list (Requirements 11.1, 11.2, 11.3, 11.4, 11.5) */}
      {sortedTopics.map((topic) => (
        <FilterItem
          key={topic.id}
          id={topic.id}
          title={topic.name}
          questionCount={topic.questionCount}
          isActive={selectedTopicId === topic.id}
          onClick={() => onSelectTopic(topic.id)}
        />
      ))}
    </div>
  )
}

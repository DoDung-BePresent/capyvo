import { Card, Empty, Flex, Tag, Typography, Tooltip } from 'antd'
import { History } from '@mui/icons-material'
import { styled } from '@/shared/utils/cn'
import { useQuestionHistory } from '../hooks/useQuestionHistory'
import { AudioPlayButton } from './AudioPlayButton'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/vi'

dayjs.extend(relativeTime)
dayjs.locale('vi')

const { Text } = Typography

const Container = styled('div', 'h-full flex flex-col')
const Header = styled('div', 'mb-4 pb-4 border-b border-gray-200')
const HistoryList = styled('div', 'flex-1 overflow-y-auto space-y-3!')
const HistoryCard = styled(Card, 'cursor-pointer rounded-lg!')

interface PracticeHistoryPanelProps {
  questionId: string | null
  partNumber?: number
  onSelectHistory?: (history: {
    transcript: string
    analysis: {
      score: number
      criteria: {
        accuracy: number
        vocabulary: number
        grammar: number
        fluency: number
      }
      issues: Array<{
        category: string
        original: string
        spoken: string
        note: string
      }>
      summary: string
    }
  }) => void
}

export function PracticeHistoryPanel({
  questionId,
  partNumber,
  onSelectHistory,
}: PracticeHistoryPanelProps) {
  const { data: history = [], isLoading } = useQuestionHistory(questionId)

  // Part 1 chỉ hiển thị accuracy và fluency
  const shouldShowAllCriteria = partNumber !== 1

  if (!questionId) {
    return (
      <Container>
        <Flex
          vertical
          align="center"
          justify="center"
          style={{ height: '100%', padding: '48px 24px' }}
        >
          <Empty description="Chọn một câu hỏi để xem lịch sử luyện tập" />
        </Flex>
      </Container>
    )
  }

  return (
    <Container>
      <Header>
        <Flex align="center" gap={8}>
          <History style={{ fontSize: 20, color: '#1890ff' }} />
          <Text strong style={{ fontSize: 16 }}>
            Lịch sử luyện tập
          </Text>
          {history.length > 0 && (
            <Tag color="blue" style={{ marginLeft: 'auto' }}>
              {history.length} lần
            </Tag>
          )}
        </Flex>
      </Header>

      <HistoryList>
        {isLoading && (
          <Flex justify="center" style={{ padding: '24px 0' }}>
            <Text type="secondary">Đang tải...</Text>
          </Flex>
        )}

        {!isLoading && history.length === 0 && (
          <Empty description="Chưa có lịch sử luyện tập cho câu này" />
        )}

        {!isLoading &&
          history.map((item) => (
            <HistoryCard
              key={item.id}
              size="small"
              onClick={() => {
                if (item.transcript && item.pronunciationScore && onSelectHistory) {
                  onSelectHistory({
                    transcript: item.transcript,
                    analysis: item.pronunciationScore,
                  })
                }
              }}
            >
              <Flex vertical gap={12}>
                <Flex align="center" justify="space-between">
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {dayjs(item.createdAt).fromNow()}
                  </Text>
                  {item.pronunciationScore && (
                    <Tag
                      color={
                        item.pronunciationScore.score >= 2.5
                          ? 'green'
                          : item.pronunciationScore.score >= 1.5
                            ? 'orange'
                            : 'red'
                      }
                    >
                      {item.pronunciationScore.score} điểm
                    </Tag>
                  )}
                </Flex>

                <Flex justify="space-between" align="center">
                  {/* Audio play button */}
                  {item.audioUrl && (
                    <div onClick={(e) => e.stopPropagation()}>
                      <AudioPlayButton audioUrl={item.audioUrl} />
                    </div>
                  )}

                  {/* Criteria tags with tooltips */}
                  {item.pronunciationScore && (
                    <Flex gap={4} wrap="wrap">
                      <Tooltip title="Độ chính xác">
                        <Tag color="blue" style={{ fontSize: 11 }}>
                          {item.pronunciationScore.criteria.accuracy}%
                        </Tag>
                      </Tooltip>
                      {shouldShowAllCriteria && (
                        <>
                          <Tooltip title="Từ vựng">
                            <Tag color="green" style={{ fontSize: 11 }}>
                              {item.pronunciationScore.criteria.vocabulary}%
                            </Tag>
                          </Tooltip>
                          <Tooltip title="Ngữ pháp">
                            <Tag color="purple" style={{ fontSize: 11 }}>
                              {item.pronunciationScore.criteria.grammar}%
                            </Tag>
                          </Tooltip>
                        </>
                      )}
                      <Tooltip title="Độ trôi chảy">
                        <Tag color="orange" style={{ fontSize: 11 }}>
                          {item.pronunciationScore.criteria.fluency}%
                        </Tag>
                      </Tooltip>
                    </Flex>
                  )}
                </Flex>
              </Flex>
            </HistoryCard>
          ))}
      </HistoryList>
    </Container>
  )
}

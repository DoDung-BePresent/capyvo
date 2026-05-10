import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/vi'
import { Card, Empty, Flex, Typography, Tag, Spin, Progress } from 'antd'

/**
 * Icons
 */
import { History, CheckCircle, Star, EmojiEvents } from '@mui/icons-material'

/**
 * Utils
 */
import { styled } from '@/shared/utils/cn'

/**
 * Hooks
 */
import { useQuery } from '@tanstack/react-query'

/**
 * QUERY_KEYS
 */
import { queryKeys } from '@/lib/query-keys'

/**
 * Services
 */
import { sessionService } from '@/features/exam/services/session.service'
import { responseService } from '@/features/exam/services/response.service'

/**
 * Setup Time
 */
dayjs.extend(relativeTime)
dayjs.locale('vi')

const { Text } = Typography

/**
 * Styled components
 */
const Container = styled('div', 'h-full flex flex-col')
const Header = styled('div', 'mb-4 pb-4 border-b border-gray-200')
const HistoryList = styled('div', 'flex-1 overflow-y-auto space-y-3!')

/**
 * [FullTestHistoruPanel] Types
 */
interface FullTestHistoryPanelProps {
  examSetId: string
  currentSessionId?: string | null
  onSelectSession?: (sessionId: string) => void
}

export function FullTestHistoryPanel({
  examSetId,
  currentSessionId,
  onSelectSession,
}: FullTestHistoryPanelProps) {
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: queryKeys.practiceSessions.myBySet(examSetId, null),
    queryFn: () => sessionService.getMySessionsBySet(examSetId, null),
  })

  const completedSessions = sessions.filter((s) => s.status === 'COMPLETED')

  const getScoreConfig = (score: number) => {
    if (score >= 160) {
      return {
        color: '#52c41a',
        bgColor: '#f6ffed',
        borderColor: '#b7eb8f',
        icon: <CheckCircle style={{ fontSize: 16 }} />,
        label: 'Xuất sắc',
      }
    } else if (score >= 120) {
      return {
        color: '#1890ff',
        bgColor: '#e6f7ff',
        borderColor: '#91d5ff',
        icon: <Star style={{ fontSize: 16 }} />,
        label: 'Tốt',
      }
    } else if (score >= 80) {
      return {
        color: '#faad14',
        bgColor: '#fffbe6',
        borderColor: '#ffe58f',
        icon: <Star style={{ fontSize: 16 }} />,
        label: 'Khá',
      }
    } else {
      return {
        color: '#ff4d4f',
        bgColor: '#fff1f0',
        borderColor: '#ffccc7',
        icon: <EmojiEvents style={{ fontSize: 16 }} />,
        label: 'Cố lên',
      }
    }
  }

  return (
    <Container>
      <Header>
        <Flex align="center" gap={8}>
          <History style={{ fontSize: 20, color: '#1890ff' }} />
          <Text strong style={{ fontSize: 16 }}>
            Lịch sử luyện tập
          </Text>
          {completedSessions.length > 0 && (
            <div
              style={{
                marginLeft: 'auto',
                backgroundColor: '#e6f7ff',
                color: '#1890ff',
                padding: '2px 8px',
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              {completedSessions.length} lần
            </div>
          )}
        </Flex>
      </Header>

      {isLoading && (
        <Flex justify="center" style={{ padding: '24px 0' }}>
          <Spin />
        </Flex>
      )}

      {!isLoading && completedSessions.length === 0 && (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Chưa có lịch sử luyện tập"
          style={{ marginTop: 48 }}
        />
      )}

      {!isLoading && completedSessions.length > 0 && (
        <HistoryList>
          {completedSessions.map((session, index) => {
            const isCurrentSession = session.id === currentSessionId
            const attemptNumber = completedSessions.length - index

            return (
              <SessionHistoryCard
                key={session.id}
                sessionId={session.id}
                attemptNumber={attemptNumber}
                isCurrentSession={isCurrentSession}
                session={session}
                onSelect={onSelectSession}
                getScoreConfig={getScoreConfig}
              />
            )
          })}
        </HistoryList>
      )}
    </Container>
  )
}

/**
 * [SessionHistoryCard] Types
 */
interface SessionHistoryCardProps {
  sessionId: string
  attemptNumber: number
  isCurrentSession: boolean
  session: {
    id: string
    _count: { userResponses: number }
    startedAt: string
  }
  onSelect?: (sessionId: string) => void
  getScoreConfig: (score: number) => {
    color: string
    bgColor: string
    borderColor: string
    icon: React.ReactElement
    label: string
  }
}

function SessionHistoryCard({
  sessionId,
  attemptNumber,
  isCurrentSession,
  session,
  onSelect,
  getScoreConfig,
}: SessionHistoryCardProps) {
  const { data: assessment, isLoading } = useQuery({
    queryKey: ['overallAssessment', sessionId],
    queryFn: () => responseService.getOverallAssessment(sessionId),
    enabled: !!sessionId,
  })

  const scoreConfig = assessment ? getScoreConfig(assessment.estimatedScore) : null

  return (
    <Card
      size="small"
      loading={isLoading}
      style={{
        cursor: 'pointer',
        borderColor: scoreConfig?.borderColor || (isCurrentSession ? '#1890ff' : '#d9d9d9'),
        borderWidth: isCurrentSession ? 2 : 3,
        transition: 'all 0.3s',
      }}
      styles={{
        body: { padding: 12 },
      }}
      onClick={() => onSelect?.(sessionId)}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none'
      }}
      className="rounded-lg!"
    >
      <Flex vertical gap={12}>
        {/* Header: Time + Score */}
        <Flex align="center" justify="space-between">
          <Flex align="center" gap={8}>
            <EmojiEvents style={{ fontSize: 18, color: '#faad14' }} />
            <Text strong>Lần {attemptNumber}</Text>
          </Flex>
          {isCurrentSession && (
            <Tag color="blue" style={{ margin: 0 }}>
              Hiện tại
            </Tag>
          )}
        </Flex>

        {!isLoading && assessment && scoreConfig && (
          <Flex vertical gap={8}>
            <Flex align="center" justify="space-between">
              <div
                style={{
                  backgroundColor: scoreConfig.bgColor,
                  color: scoreConfig.color,
                  padding: '2px 8px',
                  borderRadius: 12,
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                {scoreConfig.label}
              </div>
              <div
                style={{
                  backgroundColor: scoreConfig.bgColor,
                  color: scoreConfig.color,
                  padding: '4px 10px',
                  borderRadius: 12,
                  fontSize: 13,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                {scoreConfig.icon}
                {assessment.estimatedScore}/200
              </div>
            </Flex>

            {/* Part scores */}
            <Flex vertical gap={4}>
              {Object.entries(assessment.partScores).map(([part, score]) => (
                <Flex key={part} align="center" gap={8}>
                  <Text style={{ fontSize: 11, width: 50, flexShrink: 0 }}>Part {part}</Text>
                  <Progress
                    percent={score as number}
                    size="small"
                    strokeColor={scoreConfig.color}
                    trailColor="#f0f0f0"
                    showInfo={false}
                    style={{ flex: 1 }}
                  />
                  <Text strong style={{ fontSize: 11, width: 35, textAlign: 'right' }}>
                    {(score as number).toFixed(0)}%
                  </Text>
                </Flex>
              ))}
            </Flex>
          </Flex>
        )}

        {/* Footer: Date */}
        <Flex justify="space-between" align="center">
          <Text type="secondary" style={{ fontSize: 12 }}>
            {session._count.userResponses}/11 câu
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {dayjs(session.startedAt).fromNow()}
          </Text>
        </Flex>
      </Flex>
    </Card>
  )
}

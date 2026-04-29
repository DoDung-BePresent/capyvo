import { Card, Empty, Flex, Tag, Typography } from 'antd'
import { History, VolumeUp } from '@mui/icons-material'
import { styled } from '@/shared/utils/cn'
import { useQuestionHistory } from '../hooks/useQuestionHistory'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/vi'

dayjs.extend(relativeTime)
dayjs.locale('vi')

const { Text, Paragraph } = Typography

const Container = styled('div', 'h-full flex flex-col')
const Header = styled('div', 'mb-4 pb-4 border-b border-gray-200')
const HistoryList = styled('div', 'flex-1 overflow-y-auto space-y-3')
const HistoryCard = styled(Card, 'hover:shadow-md transition-shadow')

interface PracticeHistoryPanelProps {
  questionId: string | null
}

export function PracticeHistoryPanel({ questionId }: PracticeHistoryPanelProps) {
  const { data: history = [], isLoading } = useQuestionHistory(questionId)

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
            <HistoryCard key={item.id} size="small">
              <Flex vertical gap={12}>
                <Flex align="center" justify="space-between">
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {item.completedAt ? dayjs(item.completedAt).fromNow() : 'Chưa hoàn thành'}
                  </Text>
                  {item.pronunciationScore && (
                    <Tag
                      color={
                        item.pronunciationScore.score >= 80
                          ? 'green'
                          : item.pronunciationScore.score >= 60
                            ? 'orange'
                            : 'red'
                      }
                    >
                      {item.pronunciationScore.score} điểm
                    </Tag>
                  )}
                </Flex>

                {item.audioUrl && (
                  <Flex align="center" gap={8}>
                    <VolumeUp style={{ fontSize: 16, color: '#8c8c8c' }} />
                    <audio
                      controls
                      src={item.audioUrl}
                      style={{ width: '100%', height: 32 }}
                      preload="none"
                    />
                  </Flex>
                )}

                {item.transcript && (
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Phiên âm:
                    </Text>
                    <Paragraph
                      ellipsis={{ rows: 2, expandable: true, symbol: 'Xem thêm' }}
                      style={{ marginTop: 4, marginBottom: 0, fontSize: 13 }}
                    >
                      {item.transcript}
                    </Paragraph>
                  </div>
                )}

                {item.pronunciationScore?.summary && (
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Nhận xét:
                    </Text>
                    <Paragraph style={{ marginTop: 4, marginBottom: 0, fontSize: 13 }}>
                      {item.pronunciationScore.summary}
                    </Paragraph>
                  </div>
                )}
              </Flex>
            </HistoryCard>
          ))}
      </HistoryList>
    </Container>
  )
}

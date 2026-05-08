import { useState } from 'react'
import { Card, Empty, Flex, Typography, Progress, Segmented, Button, Modal, message } from 'antd'
import { ShareAltOutlined } from '@ant-design/icons'
import { History, CheckCircle, Star, EmojiEvents } from '@mui/icons-material'
import { styled } from '@/shared/utils/cn'
import { useQuestionHistory } from '../hooks/useQuestionHistory'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { shareService } from '../services/share.service'
import { queryKeys } from '@/lib/query-keys'
import { AudioPlayButton } from './AudioPlayButton'
import { PublicSharesPanel } from './PublicSharesPanel'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/vi'
import { getErrorMessage } from '@/shared/constants/error-messages'

dayjs.extend(relativeTime)
dayjs.locale('vi')

const { Text } = Typography

const Container = styled('div', 'h-full flex flex-col')
const Header = styled('div', 'mb-4 pb-4 border-b border-gray-200')
const Content = styled('div', 'flex-1 overflow-y-auto')
const HistoryList = styled('div', 'space-y-3!')

type TabKey = 'history' | 'community'

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
  const queryClient = useQueryClient()
  const { data: history = [], isLoading } = useQuestionHistory(questionId)
  const [activeTab, setActiveTab] = useState<TabKey>('history')
  const [shareModalVisible, setShareModalVisible] = useState(false)
  const [selectedResponseId, setSelectedResponseId] = useState<string | null>(null)

  // Part 1 chỉ hiển thị accuracy và fluency
  const shouldShowAllCriteria = partNumber !== 1

  const shareMutation = useMutation({
    mutationFn: (responseId: string) => shareService.createShare(responseId),
    onSuccess: () => {
      message.success('Đã chia sẻ bài tập thành công!')
      setShareModalVisible(false)
      setActiveTab('community')
      if (questionId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.shares.byQuestion(questionId) })
      }
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string; message?: string } } }
      const errorCode = err.response?.data?.error
      message.error(getErrorMessage(errorCode))
    },
  })

  const handleShareClick = (responseId: string) => {
    setSelectedResponseId(responseId)
    setShareModalVisible(true)
  }

  const handleConfirmShare = () => {
    if (selectedResponseId) {
      shareMutation.mutate(selectedResponseId)
    }
  }

  const getScoreConfig = (score: number, maxScore: number = 3) => {
    const percentage = (score / maxScore) * 100
    if (percentage >= 80) {
      return {
        color: '#52c41a',
        bgColor: '#f6ffed',
        borderColor: '#b7eb8f',
        icon: <CheckCircle style={{ fontSize: 16 }} />,
        label: 'Xuất sắc',
      }
    } else if (percentage >= 60) {
      return {
        color: '#faad14',
        bgColor: '#fffbe6',
        borderColor: '#ffe58f',
        icon: <Star style={{ fontSize: 16 }} />,
        label: 'Tốt',
      }
    } else {
      return {
        color: '#1890ff',
        bgColor: '#e6f7ff',
        borderColor: '#91d5ff',
        icon: <EmojiEvents style={{ fontSize: 16 }} />,
        label: 'Cố lên',
      }
    }
  }

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
        <Flex vertical gap={12}>
          <Flex align="center" gap={8}>
            <History style={{ fontSize: 20, color: '#1890ff' }} />
            <Text strong style={{ fontSize: 16 }}>
              Luyện tập
            </Text>
            {activeTab === 'history' && history.length > 0 && (
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
                {history.length} lần
              </div>
            )}
          </Flex>

          <Segmented
            value={activeTab}
            onChange={(value) => setActiveTab(value as TabKey)}
            options={[
              { label: 'Lịch sử', value: 'history' },
              { label: 'Cộng đồng', value: 'community' },
            ]}
            block
          />
        </Flex>
      </Header>

      <Content>
        {activeTab === 'history' && (
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
              history.map((item) => {
                const maxScore = partNumber === 5 ? 5 : 3
                const scoreConfig = item.pronunciationScore
                  ? getScoreConfig(item.pronunciationScore.score, maxScore)
                  : null

                return (
                  <Card
                    key={item.id}
                    size="small"
                    style={{
                      cursor: 'pointer',
                      borderColor: scoreConfig?.borderColor || '#d9d9d9',
                      borderWidth: 3,
                      transition: 'all 0.3s',
                    }}
                    styles={{
                      body: { padding: 12 },
                    }}
                    onClick={() => {
                      if (item.transcript && item.pronunciationScore && onSelectHistory) {
                        onSelectHistory({
                          transcript: item.transcript,
                          analysis: item.pronunciationScore,
                        })
                      }
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                    className="rounded-lg!"
                  >
                    <Flex vertical gap={12}>
                      {/* Header: Time + Score + Share Button */}
                      <Flex align="center" justify="space-between">
                        <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
                          {dayjs(item.createdAt).fromNow()}
                        </Text>
                        <Flex align="center" gap={8}>
                          {item.pronunciationScore && scoreConfig && (
                            <>
                              {/* Label badge */}
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
                              {/* Score badge */}
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
                                {item.pronunciationScore.score} điểm
                              </div>
                            </>
                          )}
                          {/* Share button - only show if has transcript */}
                          {item.transcript && (
                            <Button
                              type="text"
                              size="small"
                              icon={<ShareAltOutlined />}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleShareClick(item.id)
                              }}
                              style={{ padding: '4px 8px' }}
                            />
                          )}
                        </Flex>
                      </Flex>

                      {/* Content: Audio + Criteria */}
                      <Flex gap={12} align="flex-start">
                        {/* Audio button */}
                        {item.audioUrl && (
                          <div onClick={(e) => e.stopPropagation()}>
                            <AudioPlayButton audioUrl={item.audioUrl} />
                          </div>
                        )}

                        {/* Criteria progress bars */}
                        {item.pronunciationScore && (
                          <Flex vertical gap={6} style={{ flex: 1 }}>
                            <Flex align="center" gap={8}>
                              <Text style={{ fontSize: 12, width: 80, flexShrink: 0 }}>
                                Độ chính xác
                              </Text>
                              <Progress
                                percent={item.pronunciationScore.criteria.accuracy}
                                size="small"
                                strokeColor="#52c41a"
                                trailColor="#f0f0f0"
                                showInfo={false}
                                style={{ flex: 1 }}
                              />
                              <Text strong style={{ fontSize: 12, width: 35, textAlign: 'right' }}>
                                {item.pronunciationScore.criteria.accuracy}%
                              </Text>
                            </Flex>

                            {shouldShowAllCriteria && (
                              <>
                                <Flex align="center" gap={8}>
                                  <Text style={{ fontSize: 12, width: 80, flexShrink: 0 }}>
                                    Từ vựng
                                  </Text>
                                  <Progress
                                    percent={item.pronunciationScore.criteria.vocabulary}
                                    size="small"
                                    strokeColor="#1890ff"
                                    trailColor="#f0f0f0"
                                    showInfo={false}
                                    style={{ flex: 1 }}
                                  />
                                  <Text
                                    strong
                                    style={{ fontSize: 12, width: 35, textAlign: 'right' }}
                                  >
                                    {item.pronunciationScore.criteria.vocabulary}%
                                  </Text>
                                </Flex>

                                <Flex align="center" gap={8}>
                                  <Text style={{ fontSize: 12, width: 80, flexShrink: 0 }}>
                                    Ngữ pháp
                                  </Text>
                                  <Progress
                                    percent={item.pronunciationScore.criteria.grammar}
                                    size="small"
                                    strokeColor="#722ed1"
                                    trailColor="#f0f0f0"
                                    showInfo={false}
                                    style={{ flex: 1 }}
                                  />
                                  <Text
                                    strong
                                    style={{ fontSize: 12, width: 35, textAlign: 'right' }}
                                  >
                                    {item.pronunciationScore.criteria.grammar}%
                                  </Text>
                                </Flex>
                              </>
                            )}

                            <Flex align="center" gap={8}>
                              <Text style={{ fontSize: 12, width: 80, flexShrink: 0 }}>
                                Độ trôi chảy
                              </Text>
                              <Progress
                                percent={item.pronunciationScore.criteria.fluency}
                                size="small"
                                strokeColor="#faad14"
                                trailColor="#f0f0f0"
                                showInfo={false}
                                style={{ flex: 1 }}
                              />
                              <Text strong style={{ fontSize: 12, width: 35, textAlign: 'right' }}>
                                {item.pronunciationScore.criteria.fluency}%
                              </Text>
                            </Flex>
                          </Flex>
                        )}
                      </Flex>
                    </Flex>
                  </Card>
                )
              })}
          </HistoryList>
        )}

        {activeTab === 'community' && <PublicSharesPanel questionId={questionId} />}
      </Content>

      {/* Share Confirmation Modal */}
      <Modal
        title="Chia sẻ bài tập"
        open={shareModalVisible}
        onOk={handleConfirmShare}
        onCancel={() => setShareModalVisible(false)}
        okText="Chia sẻ"
        cancelText="Hủy"
        confirmLoading={shareMutation.isPending}
      >
        <Text>Bạn có muốn chia sẻ bài tập này với cộng đồng không?</Text>
      </Modal>
    </Container>
  )
}

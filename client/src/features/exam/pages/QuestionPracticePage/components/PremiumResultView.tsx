/**
 * Icons
 */
import { Refresh } from '@mui/icons-material'

/**
 * Utils
 */
import { hexToRgba } from '@/shared/utils/color'
import { styled } from '@/shared/utils/cn'

/**
 * Types
 */
import type { AnalysisResult } from '@/features/exam/services/session.service'
import type { PartNumber } from '@/shared/types/domain'

/**
 * Components
 */
import { AudioPlayButton } from '@/features/exam/components/AudioPlayButton'
import { StyledButton } from '@/shared/components'
import { Card, Typography, Flex, Progress, Tag, Tooltip, Space, Skeleton } from 'antd'

/**
 * Constants
 */
import { COLORS } from '@/shared/constants/user-color'

const { Title, Text, Paragraph } = Typography

const Container = styled('div', 'h-full flex flex-col')
const ResultCard = styled(Card, 'flex-1 overflow-y-auto rounded-lg! min-h-0')
const ControlPanel = styled(Card, 'rounded-lg! shrink-0 mt-4!')
const ScoreSection = styled('div', 'flex gap-6')
const TranscriptSection = styled('div', 'flex-1')

// Màu sắc cho từng loại lỗi
const ERROR_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  omission: { bg: '#fff1f0', border: '#ffa39e', text: '#cf1322' },
  addition: { bg: '#fff7e6', border: '#ffd591', text: '#d46b08' },
  morphology: { bg: '#f6ffed', border: '#b7eb8f', text: '#389e0d' },
  pronunciation: { bg: '#e6f7ff', border: '#91d5ff', text: '#096dd9' },
  substitution: { bg: '#f9f0ff', border: '#d3adf7', text: '#531dab' },
  order: { bg: '#fff0f6', border: '#ffadd2', text: '#c41d7f' },
  grammar: { bg: '#fffbe6', border: '#ffe58f', text: '#d48806' },
  vocabulary: { bg: '#e6fffb', border: '#87e8de', text: '#08979c' },
}

const ERROR_LABELS: Record<string, string> = {
  omission: 'Thiếu từ',
  addition: 'Thêm từ',
  morphology: 'Sai dạng từ',
  pronunciation: 'Phát âm',
  substitution: 'Thay thế',
  order: 'Sai thứ tự',
  grammar: 'Ngữ pháp',
  vocabulary: 'Từ vựng',
}

// Thang điểm theo part
const SCORE_SCALES: Record<PartNumber, { max: number; label: string }> = {
  1: { max: 3, label: 'Phát âm & Ngữ điệu' },
  2: { max: 3, label: 'Mô tả tranh' },
  3: { max: 3, label: 'Trả lời câu hỏi' },
  4: { max: 3, label: 'Trả lời dựa trên tài liệu' },
  5: { max: 5, label: 'Nêu quan điểm' },
}

interface PremiumResultViewProps {
  partNumber: PartNumber
  transcript?: string
  analysis?: AnalysisResult
  referenceText?: string
  audioUrl?: string
  isLoading?: boolean
  onReset: () => void
}

export function PremiumResultView({
  partNumber,
  transcript,
  analysis,
  referenceText,
  audioUrl,
  isLoading = false,
  onReset,
}: PremiumResultViewProps) {
  const scale = SCORE_SCALES[partNumber]

  // Loading skeleton
  if (isLoading) {
    return (
      <Container>
        <ResultCard>
          <ScoreSection>
            {/* Left: Score Circle Skeleton */}
            <div style={{ width: 200, flexShrink: 0 }}>
              <Flex vertical align="center" gap={12}>
                <Skeleton.Avatar active size={160} shape="circle" />
                <Skeleton.Input active size="small" style={{ width: 120 }} />
                <div style={{ width: '100%', marginTop: 8 }}>
                  <Space direction="vertical" size={8} style={{ width: '100%' }}>
                    <Skeleton.Input active size="small" style={{ width: '100%' }} />
                    {partNumber !== 1 && (
                      <>
                        <Skeleton.Input active size="small" style={{ width: '100%' }} />
                        <Skeleton.Input active size="small" style={{ width: '100%' }} />
                      </>
                    )}
                    <Skeleton.Input active size="small" style={{ width: '100%' }} />
                  </Space>
                </div>
              </Flex>
            </div>

            {/* Right: Transcript Skeleton */}
            <TranscriptSection>
              <Skeleton.Input active size="large" style={{ width: 200, marginBottom: 16 }} />
              <Skeleton paragraph={{ rows: 6 }} active />
            </TranscriptSection>
          </ScoreSection>
        </ResultCard>
        <ControlPanel>
          <Flex justify="flex-end">
            <Skeleton.Button active size="large" style={{ width: 120 }} />
          </Flex>
        </ControlPanel>
      </Container>
    )
  }

  if (!analysis) {
    return null
  }

  const scorePercentage = (analysis.score / scale.max) * 100

  return (
    <Container>
      <ResultCard>
        <ScoreSection>
          {/* Left: Score Circle */}
          <div style={{ width: 200, flexShrink: 0 }}>
            <Flex vertical align="center" gap={12}>
              <Progress
                type="circle"
                percent={scorePercentage}
                format={() => (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 32, fontWeight: 700, color: '#1890ff' }}>
                      {analysis.score.toFixed(1)}
                    </div>
                    <div style={{ fontSize: 14, color: '#8c8c8c' }}>/ {scale.max}</div>
                  </div>
                )}
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
                strokeWidth={8}
                size={160}
              />
              <Text type="secondary" style={{ fontSize: 13, textAlign: 'center' }}>
                {scale.label}
              </Text>

              {/* Audio Player */}
              {audioUrl && (
                <div style={{ marginTop: 8 }}>
                  <AudioPlayButton audioUrl={audioUrl} />
                </div>
              )}

              {/* Criteria Progress Bars */}
              <div style={{ width: '100%', marginTop: 8 }}>
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  <Tooltip title="Độ chính xác">
                    <Progress
                      percent={analysis.criteria.accuracy}
                      size="small"
                      strokeColor="#52c41a"
                      format={(percent) => <Text style={{ fontSize: 12 }}>{percent}%</Text>}
                    />
                  </Tooltip>
                  {partNumber !== 1 && (
                    <>
                      <Tooltip title="Từ vựng">
                        <Progress
                          percent={analysis.criteria.vocabulary}
                          size="small"
                          strokeColor="#1890ff"
                          format={(percent) => <Text style={{ fontSize: 12 }}>{percent}%</Text>}
                        />
                      </Tooltip>
                      <Tooltip title="Ngữ pháp">
                        <Progress
                          percent={analysis.criteria.grammar}
                          size="small"
                          strokeColor="#722ed1"
                          format={(percent) => <Text style={{ fontSize: 12 }}>{percent}%</Text>}
                        />
                      </Tooltip>
                    </>
                  )}
                  <Tooltip title="Độ trôi chảy">
                    <Progress
                      percent={analysis.criteria.fluency}
                      size="small"
                      strokeColor="#faad14"
                      format={(percent) => <Text style={{ fontSize: 12 }}>{percent}%</Text>}
                    />
                  </Tooltip>
                </Space>
              </div>
            </Flex>
          </div>

          {/* Right: Transcript & Issues */}
          <TranscriptSection>
            <Flex vertical gap={24}>
              {/* Summary */}
              {analysis.summary && (
                <div>
                  <Title level={5} style={{ marginBottom: 12 }}>
                    Nhận xét tổng quan
                  </Title>
                  <Paragraph
                    style={{
                      fontSize: 15,
                      lineHeight: 1.8,
                      backgroundColor: '#f0f5ff',
                      padding: 16,
                      borderRadius: 8,
                      border: '1px solid #adc6ff',
                    }}
                  >
                    {analysis.summary}
                  </Paragraph>
                </div>
              )}

              {/* Reference Text */}
              {referenceText && (
                <div>
                  <Title level={5} style={{ marginBottom: 12 }}>
                    Nội dung tham khảo
                  </Title>
                  <Paragraph
                    style={{
                      fontSize: 15,
                      lineHeight: 1.8,
                      backgroundColor: '#f5f5f5',
                      padding: 16,
                      borderRadius: 8,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {referenceText}
                  </Paragraph>
                </div>
              )}

              {/* Transcript */}
              {transcript && (
                <div>
                  <Title level={5} style={{ marginBottom: 12 }}>
                    Phiên âm của bạn
                  </Title>
                  <Paragraph
                    style={{
                      fontSize: 15,
                      lineHeight: 1.8,
                      backgroundColor: '#e6f7ff',
                      padding: 16,
                      borderRadius: 8,
                      whiteSpace: 'pre-wrap',
                      border: '1px solid #91d5ff',
                    }}
                  >
                    {transcript}
                  </Paragraph>
                </div>
              )}

              {/* Issues */}
              {analysis.issues && analysis.issues.length > 0 && (
                <div>
                  <Title level={5} style={{ marginBottom: 12 }}>
                    Các lỗi cần cải thiện ({analysis.issues.length})
                  </Title>
                  <Space direction="vertical" size={12} style={{ width: '100%' }}>
                    {analysis.issues.map((issue, index) => {
                      const colors = ERROR_COLORS[issue.category] || ERROR_COLORS.substitution
                      return (
                        <Card
                          key={index}
                          size="small"
                          style={{
                            backgroundColor: colors.bg,
                            borderColor: colors.border,
                            borderWidth: 2,
                          }}
                        >
                          <Flex vertical gap={8}>
                            <Flex align="center" gap={8}>
                              <Tag color={colors.text} style={{ margin: 0 }}>
                                {ERROR_LABELS[issue.category] || issue.category}
                              </Tag>
                              <Text style={{ fontSize: 13, color: '#595959' }}>{issue.note}</Text>
                            </Flex>
                            <Flex gap={12} align="center">
                              <div style={{ flex: 1 }}>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  Nên nói:
                                </Text>
                                <div
                                  style={{
                                    fontSize: 14,
                                    fontWeight: 500,
                                    color: '#52c41a',
                                    marginTop: 4,
                                  }}
                                >
                                  {issue.original}
                                </div>
                              </div>
                              <div style={{ flex: 1 }}>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  Bạn nói:
                                </Text>
                                <div
                                  style={{
                                    fontSize: 14,
                                    fontWeight: 500,
                                    color: colors.text,
                                    marginTop: 4,
                                  }}
                                >
                                  {issue.spoken}
                                </div>
                              </div>
                            </Flex>
                          </Flex>
                        </Card>
                      )
                    })}
                  </Space>
                </div>
              )}
            </Flex>
          </TranscriptSection>
        </ScoreSection>
      </ResultCard>

      {/* Control Panel */}
      <ControlPanel>
        <Flex justify="flex-end">
          <StyledButton
            size="large"
            type="primary"
            icon={<Refresh style={{ fontSize: 20 }} />}
            onClick={onReset}
            shadowColor={hexToRgba(COLORS.primary, 0.6)}
            style={{
              backgroundColor: COLORS.primary,
              borderColor: COLORS.primary,
            }}
          >
            Luyện lại
          </StyledButton>
        </Flex>
      </ControlPanel>
    </Container>
  )
}

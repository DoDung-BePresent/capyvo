import { Card, Typography, Flex, Progress, Tag, Tooltip, Space, Skeleton } from 'antd'
import { Refresh } from '@mui/icons-material'
import { styled } from '@/shared/utils/cn'
import type { AnalysisResult } from '@/features/exam/services/session.service'
import type { PartNumber } from '@/features/admin/types'
import { AudioPlayButton } from './AudioPlayButton'
import { UpgradeCTA } from './UpgradeCTA'
import { StyledButton } from '@/shared/components'
import { COLORS } from '@/shared/constants/user-color'
import { hexToRgba } from '@/shared/utils/color'

const { Title, Text, Paragraph } = Typography

const Container = styled('div', 'h-full flex flex-col')
const ResultCard = styled(Card, 'flex-1 overflow-y-auto rounded-lg! min-h-0')
const ControlPanel = styled(Card, 'rounded-lg! flex-shrink-0 mt-4!')
const ScoreSection = styled('div', 'flex gap-6')
const TranscriptSection = styled('div', 'flex-1')

// Màu sắc cho từng loại lỗi
const ERROR_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  omission: { bg: '#fff1f0', border: '#ffa39e', text: '#cf1322' }, // Đỏ nhạt
  addition: { bg: '#fff7e6', border: '#ffd591', text: '#d46b08' }, // Cam nhạt
  morphology: { bg: '#f6ffed', border: '#b7eb8f', text: '#389e0d' }, // Xanh lá nhạt
  pronunciation: { bg: '#e6f7ff', border: '#91d5ff', text: '#096dd9' }, // Xanh dương nhạt
  substitution: { bg: '#f9f0ff', border: '#d3adf7', text: '#531dab' }, // Tím nhạt
  order: { bg: '#fff0f6', border: '#ffadd2', text: '#c41d7f' }, // Hồng nhạt
  grammar: { bg: '#fffbe6', border: '#ffe58f', text: '#d48806' }, // Vàng nhạt
  vocabulary: { bg: '#e6fffb', border: '#87e8de', text: '#08979c' }, // Xanh ngọc nhạt
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

interface ResultViewProps {
  partNumber: PartNumber
  transcript?: string
  analysis?: AnalysisResult
  referenceText?: string
  audioUrl?: string
  isLoading?: boolean
  isPremium?: boolean // New prop to determine if user has premium
  onReset: () => void // Required callback to practice again (either reset or close result view)
}

export function ResultView({
  partNumber,
  transcript,
  analysis,
  referenceText,
  audioUrl,
  isLoading = false,
  isPremium = true, // Default to true for backward compatibility
  onReset,
}: ResultViewProps) {
  const scale = SCORE_SCALES[partNumber]

  // Loading skeleton
  if (isLoading) {
    return (
      <Container>
        <ResultCard>
          <ScoreSection>
            {/* Left: Score Circle Skeleton */}
            {isPremium && (
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
            )}

            {/* Right: Transcript Skeleton */}
            <TranscriptSection>
              <Flex vertical gap={16}>
                {referenceText && (
                  <div>
                    <Skeleton.Input active size="small" style={{ width: 150, marginBottom: 8 }} />
                    <Skeleton active paragraph={{ rows: 2 }} title={false} />
                  </div>
                )}
                <div>
                  <Skeleton.Input active size="small" style={{ width: 150, marginBottom: 8 }} />
                  <Skeleton active paragraph={{ rows: 3 }} title={false} />
                </div>
                <div>
                  <Skeleton.Input active size="small" style={{ width: 100, marginBottom: 8 }} />
                  <Skeleton active paragraph={{ rows: 2 }} title={false} />
                </div>
              </Flex>
            </TranscriptSection>
          </ScoreSection>
        </ResultCard>
      </Container>
    )
  }

  // BASIC user: Show transcript only + upgrade CTA
  if (!isPremium || !analysis) {
    return (
      <Container>
        <ResultCard>
          <Flex vertical gap={16}>
            {/* Reference text (if available) */}
            {referenceText && (
              <div>
                <Title level={5} style={{ marginBottom: 8 }}>
                  Nội dung tham khảo
                </Title>
                <Paragraph
                  style={{
                    fontSize: 14,
                    lineHeight: 1.8,
                    backgroundColor: '#f5f5f5',
                    padding: 12,
                    borderRadius: 8,
                    color: '#595959',
                  }}
                >
                  {referenceText}
                </Paragraph>
              </div>
            )}

            {/* Transcript only */}
            <div>
              <Flex align="center" gap={8} style={{ marginBottom: 8 }}>
                <Title level={5} style={{ margin: 0 }}>
                  Phiên âm của bạn
                </Title>
                {audioUrl && <AudioPlayButton audioUrl={audioUrl} />}
              </Flex>
              {transcript && transcript.trim() !== '' ? (
                <Paragraph style={{ fontSize: 15, lineHeight: 2 }}>{transcript}</Paragraph>
              ) : (
                <Paragraph
                  style={{ fontSize: 15, lineHeight: 2, color: '#8c8c8c', fontStyle: 'italic' }}
                >
                  (Không có phiên âm)
                </Paragraph>
              )}
            </div>

            {/* Upgrade CTA inline */}
            <UpgradeCTA />
          </Flex>
        </ResultCard>

        {/* Control Panel with Reset button */}
        <ControlPanel>
          <Flex justify="end">
            <StyledButton
              size="large"
              type="primary"
              icon={<Refresh style={{ fontSize: 20 }} />}
              onClick={onReset}
              shadowColor={hexToRgba(COLORS.primary, 0.6)}
              style={{
                minWidth: 150,
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

  // PREMIUM user: Show full analysis
  const normalizedScore = analysis.score // Use score directly from API (already on correct scale)

  // Render transcript với highlight lỗi
  const renderHighlightedTranscript = () => {
    if (!transcript || transcript.trim() === '') {
      return (
        <Paragraph style={{ fontSize: 15, lineHeight: 2, color: '#8c8c8c', fontStyle: 'italic' }}>
          (Không có phiên âm)
        </Paragraph>
      )
    }

    if (analysis.issues.length === 0) {
      return <Paragraph style={{ fontSize: 15, lineHeight: 2 }}>{transcript}</Paragraph>
    }

    // Tạo array các đoạn text với thông tin lỗi
    const segments: Array<{ text: string; issue?: (typeof analysis.issues)[0] }> = []
    let lastIndex = 0

    // Sort issues by position in transcript
    const sortedIssues = [...analysis.issues].sort((a, b) => {
      const aIndex = transcript.toLowerCase().indexOf(a.spoken.toLowerCase())
      const bIndex = transcript.toLowerCase().indexOf(b.spoken.toLowerCase())
      return aIndex - bIndex
    })

    sortedIssues.forEach((issue) => {
      const spokenLower = issue.spoken.toLowerCase()
      const transcriptLower = transcript.toLowerCase()
      const index = transcriptLower.indexOf(spokenLower, lastIndex)

      if (index !== -1) {
        // Add text before error
        if (index > lastIndex) {
          segments.push({ text: transcript.substring(lastIndex, index) })
        }

        // Add error segment
        segments.push({
          text: transcript.substring(index, index + issue.spoken.length),
          issue,
        })

        lastIndex = index + issue.spoken.length
      }
    })

    // Add remaining text
    if (lastIndex < transcript.length) {
      segments.push({ text: transcript.substring(lastIndex) })
    }

    return (
      <Paragraph style={{ fontSize: 15, lineHeight: 2 }}>
        {segments.map((segment, index) => {
          if (!segment.issue) {
            return <span key={index}>{segment.text}</span>
          }

          const colors = ERROR_COLORS[segment.issue.category] || {
            bg: '#f5f5f5',
            border: '#d9d9d9',
            text: '#595959',
          }
          return (
            <Tooltip
              key={index}
              title={
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>
                    {ERROR_LABELS[segment.issue.category] || segment.issue.category}
                  </div>
                  {segment.issue.original && (
                    <div style={{ marginBottom: 4 }}>
                      <Text style={{ color: '#fff', opacity: 0.85 }}>
                        Đúng: <strong>{segment.issue.original}</strong>
                      </Text>
                    </div>
                  )}
                  <div>
                    <Text style={{ color: '#fff', opacity: 0.85 }}>{segment.issue.note}</Text>
                  </div>
                </div>
              }
              overlayStyle={{ maxWidth: 300 }}
            >
              <span
                style={{
                  backgroundColor: colors.bg,
                  borderBottom: `2px solid ${colors.border}`,
                  color: colors.text,
                  padding: '2px 4px',
                  borderRadius: 4,
                  cursor: 'help',
                  fontWeight: 500,
                }}
              >
                {segment.text}
              </span>
            </Tooltip>
          )
        })}
      </Paragraph>
    )
  }

  return (
    <Container>
      <ResultCard>
        <ScoreSection>
          {/* Left: Score Circle */}
          <div style={{ width: 200, flexShrink: 0 }}>
            <Flex vertical align="center" gap={12}>
              <Progress
                type="circle"
                percent={(normalizedScore / scale.max) * 100}
                format={() => (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 32, fontWeight: 700, lineHeight: 1 }}>
                      {normalizedScore}
                    </div>
                    <div style={{ fontSize: 14, color: '#8c8c8c', marginTop: 4 }}>
                      / {scale.max}
                    </div>
                  </div>
                )}
                strokeColor={{
                  '0%': normalizedScore >= scale.max * 0.8 ? '#52c41a' : '#1890ff',
                  '100%': normalizedScore >= scale.max * 0.8 ? '#73d13d' : '#40a9ff',
                }}
                strokeWidth={10}
                size={160}
              />
              <Text type="secondary" style={{ fontSize: 13, textAlign: 'center' }}>
                {scale.label}
              </Text>

              {/* Criteria breakdown */}
              <div style={{ width: '100%', marginTop: 8 }}>
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  <Flex justify="space-between">
                    <Text style={{ fontSize: 12 }}>Độ chính xác</Text>
                    <Text strong style={{ fontSize: 12 }}>
                      {analysis.criteria.accuracy}%
                    </Text>
                  </Flex>
                  {partNumber !== 1 && (
                    <>
                      <Flex justify="space-between">
                        <Text style={{ fontSize: 12 }}>Từ vựng</Text>
                        <Text strong style={{ fontSize: 12 }}>
                          {analysis.criteria.vocabulary}%
                        </Text>
                      </Flex>
                      <Flex justify="space-between">
                        <Text style={{ fontSize: 12 }}>Ngữ pháp</Text>
                        <Text strong style={{ fontSize: 12 }}>
                          {analysis.criteria.grammar}%
                        </Text>
                      </Flex>
                    </>
                  )}
                  <Flex justify="space-between">
                    <Text style={{ fontSize: 12 }}>Độ trôi chảy</Text>
                    <Text strong style={{ fontSize: 12 }}>
                      {analysis.criteria.fluency}%
                    </Text>
                  </Flex>
                </Space>
              </div>
            </Flex>
          </div>

          {/* Right: Transcript with highlights */}
          <TranscriptSection>
            <Flex vertical gap={16}>
              {/* Reference text (if available) */}
              {referenceText && (
                <div>
                  <Title level={5} style={{ marginBottom: 8 }}>
                    Nội dung tham khảo
                  </Title>
                  <Paragraph
                    style={{
                      fontSize: 14,
                      lineHeight: 1.8,
                      backgroundColor: '#f5f5f5',
                      padding: 12,
                      borderRadius: 8,
                      color: '#595959',
                    }}
                  >
                    {referenceText}
                  </Paragraph>
                </div>
              )}

              {/* Transcript with errors */}
              <div>
                <Flex align="center" justify="space-between" style={{ marginBottom: 8 }}>
                  <Flex align="center" gap={8}>
                    <Title level={5} style={{ margin: 0 }}>
                      Phiên âm của bạn
                    </Title>
                    {audioUrl && <AudioPlayButton audioUrl={audioUrl} />}
                  </Flex>
                  {analysis.issues.length > 0 && (
                    <Tag color="orange">{analysis.issues.length} lỗi</Tag>
                  )}
                </Flex>
                {renderHighlightedTranscript()}
              </div>

              {/* Error legend */}
              {analysis.issues.length > 0 && (
                <div>
                  <Text
                    type="secondary"
                    style={{ fontSize: 12, marginBottom: 8, display: 'block' }}
                  >
                    Chú thích màu sắc:
                  </Text>
                  <Flex gap={8} wrap="wrap">
                    {Object.entries(ERROR_LABELS).map(([key, label]) => {
                      const hasError = analysis.issues.some((issue) => issue.category === key)
                      if (!hasError) return null

                      const colors = ERROR_COLORS[key] || {
                        bg: '#f5f5f5',
                        border: '#d9d9d9',
                        text: '#595959',
                      }
                      return (
                        <Tag
                          key={key}
                          style={{
                            backgroundColor: colors.bg,
                            borderColor: colors.border,
                            color: colors.text,
                          }}
                        >
                          {label}
                        </Tag>
                      )
                    })}
                  </Flex>
                </div>
              )}

              {/* Summary */}
              {analysis.summary && (
                <div>
                  <Title level={5} style={{ marginBottom: 8 }}>
                    Nhận xét
                  </Title>
                  <Paragraph style={{ fontSize: 14, lineHeight: 1.8, color: '#595959' }}>
                    {analysis.summary}
                  </Paragraph>
                </div>
              )}
            </Flex>
          </TranscriptSection>
        </ScoreSection>
      </ResultCard>

      {/* Control Panel with Reset button */}
      <ControlPanel>
        <Flex justify="end">
          <StyledButton
            size="large"
            type="primary"
            icon={<Refresh style={{ fontSize: 20 }} />}
            onClick={onReset}
            shadowColor={hexToRgba(COLORS.primary, 0.6)}
            style={{
              minWidth: 150,
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

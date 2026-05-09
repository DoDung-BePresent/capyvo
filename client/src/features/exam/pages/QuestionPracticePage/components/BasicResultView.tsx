import { Card, Typography, Flex, Skeleton } from 'antd'

/**
 * Icons
 */
import { Refresh } from '@mui/icons-material'

/**
 * Utils
 */
import { styled } from '@/shared/utils/cn'
import { hexToRgba } from '@/shared/utils/color'

/**
 * Types
 */
import type { PartNumber } from '@/shared/types/domain'

/**
 * Components
 */
import { AudioPlayButton } from '@/features/exam/components/AudioPlayButton'
import { UpgradeCTA } from '@/features/exam/components/UpgradeCTA'
import { StyledButton } from '@/shared/components'

/**
 * Constants
 */
import { COLORS } from '@/shared/constants/user-color'

const { Title, Text, Paragraph } = Typography

const Container = styled('div', 'h-full flex flex-col')
const ResultCard = styled(Card, 'flex-1 overflow-y-auto rounded-lg! min-h-0')
const ControlPanel = styled(Card, 'rounded-lg! shrink-0 mt-4!')
const TranscriptSection = styled('div', 'w-full')

interface BasicResultViewProps {
  partNumber: PartNumber
  transcript?: string
  referenceText?: string
  audioUrl?: string
  isLoading?: boolean
  onReset: () => void
}

export function BasicResultView({
  transcript,
  referenceText,
  audioUrl,
  isLoading = false,
  onReset,
}: BasicResultViewProps) {
  // Loading skeleton
  if (isLoading) {
    return (
      <Container>
        <ResultCard>
          <Flex vertical gap={24}>
            <div>
              <Skeleton.Input active size="large" style={{ width: 200, marginBottom: 16 }} />
              <Skeleton paragraph={{ rows: 4 }} active />
            </div>
          </Flex>
        </ResultCard>
        <ControlPanel>
          <Flex justify="flex-end">
            <Skeleton.Button active size="large" style={{ width: 120 }} />
          </Flex>
        </ControlPanel>
      </Container>
    )
  }

  return (
    <Container>
      <ResultCard>
        <Flex vertical gap={24}>
          {/* Upgrade CTA */}
          <UpgradeCTA />

          {/* Audio Player */}
          {audioUrl && (
            <Flex align="center" gap={12}>
              <AudioPlayButton audioUrl={audioUrl} />
              <Text type="secondary">Nghe lại bài tập của bạn</Text>
            </Flex>
          )}

          {/* Reference Text */}
          {referenceText && (
            <TranscriptSection>
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
            </TranscriptSection>
          )}

          {/* Transcript */}
          {transcript && (
            <TranscriptSection>
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
            </TranscriptSection>
          )}
        </Flex>
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

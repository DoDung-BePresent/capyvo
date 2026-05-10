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

const { Title, Paragraph } = Typography

const Container = styled('div', 'h-full flex flex-col')
const ResultCard = styled(Card, 'flex-1 overflow-y-auto rounded-lg! min-h-0')
const ControlPanel = styled(Card, 'rounded-lg! shrink-0 mt-4!')

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
        </ResultCard>
      </Container>
    )
  }

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
        <Flex justify="flex-end">
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

import { Card, Typography, Flex } from 'antd'

/**
 * Utils
 */
import { styled } from '@/shared/utils/cn'
import { hexToRgba } from '@/shared/utils/color'

/**
 * Components
 */
import { StyledButton } from '@/shared/components'

/**
 * Constants
 */
import { COLORS } from '@/shared/constants/user-color'

/**
 * Types
 */
import { TEST_INTRO_TEXT } from '@/features/exam/types/full-test.types'

const { Title, Paragraph } = Typography

const Container = styled('div', 'h-full flex flex-col gap-4!')
const ContentCard = styled(Card, 'flex-1 overflow-y-auto mb-4')
const ControlPanel = styled(Card, 'mt-auto')

interface TestIntroViewProps {
  onStart: () => void
}

export function TestIntroView({ onStart }: TestIntroViewProps) {
  return (
    <Container>
      <ContentCard>
        <Flex vertical gap={24}>
          <Title level={3} style={{ textAlign: 'center', marginBottom: 0 }}>
            TOEIC Speaking Test Directions
          </Title>

          <Paragraph style={{ fontSize: 15, lineHeight: 1.8, whiteSpace: 'pre-line' }}>
            {TEST_INTRO_TEXT}
          </Paragraph>

          <div
            style={{
              backgroundColor: '#f5f5f5',
              padding: 16,
              borderRadius: 8,
              border: '1px solid #d9d9d9',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #d9d9d9' }}>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>Question</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>Task</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>Evaluation Criteria</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #e8e8e8' }}>
                  <td style={{ padding: '12px 8px' }}>1-2</td>
                  <td style={{ padding: '12px 8px' }}>Read a text aloud</td>
                  <td style={{ padding: '12px 8px' }}>
                    • pronunciation
                    <br />• intonation and stress
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e8e8e8' }}>
                  <td style={{ padding: '12px 8px' }}>3-4</td>
                  <td style={{ padding: '12px 8px' }}>Describe a picture</td>
                  <td style={{ padding: '12px 8px' }}>
                    all of the above, plus
                    <br />• grammar
                    <br />• vocabulary
                    <br />• cohesion
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e8e8e8' }}>
                  <td style={{ padding: '12px 8px' }}>5-7</td>
                  <td style={{ padding: '12px 8px' }}>Respond to questions</td>
                  <td style={{ padding: '12px 8px' }}>
                    all of the above, plus
                    <br />• relevance of content
                    <br />• completeness of content
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e8e8e8' }}>
                  <td style={{ padding: '12px 8px' }}>8-10</td>
                  <td style={{ padding: '12px 8px' }}>
                    Respond to questions using information provided
                  </td>
                  <td style={{ padding: '12px 8px' }}>all of the above</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px 8px' }}>11</td>
                  <td style={{ padding: '12px 8px' }}>Express an opinion</td>
                  <td style={{ padding: '12px 8px' }}>all of the above</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Flex>
      </ContentCard>

      <ControlPanel>
        <Flex justify="end">
          <StyledButton
            size="large"
            type="primary"
            onClick={onStart}
            shadowColor={hexToRgba(COLORS.primary, 0.6)}
            style={{
              minWidth: 200,
              backgroundColor: COLORS.primary,
              borderColor: COLORS.primary,
            }}
          >
            Bắt đầu thi
          </StyledButton>
        </Flex>
      </ControlPanel>
    </Container>
  )
}

import { Card, Typography, Flex, Table } from 'antd'

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

interface TestStructureData {
  key: string
  question: string
  task: string
  criteria: string[]
}

const columns = [
  {
    title: 'Question',
    dataIndex: 'question',
    key: 'question',
    width: 100,
  },
  {
    title: 'Task',
    dataIndex: 'task',
    key: 'task',
  },
  {
    title: 'Evaluation Criteria',
    dataIndex: 'criteria',
    key: 'criteria',
    render: (criteria: string[]) => (
      <div>
        {criteria.map((item, index) => (
          <div key={index}>• {item}</div>
        ))}
      </div>
    ),
  },
]

const dataSource: TestStructureData[] = [
  {
    key: '1',
    question: '1-2',
    task: 'Read a text aloud',
    criteria: ['pronunciation', 'intonation and stress'],
  },
  {
    key: '2',
    question: '3-4',
    task: 'Describe a picture',
    criteria: ['all of the above, plus', 'grammar', 'vocabulary', 'cohesion'],
  },
  {
    key: '3',
    question: '5-7',
    task: 'Respond to questions',
    criteria: ['all of the above, plus', 'relevance of content', 'completeness of content'],
  },
  {
    key: '4',
    question: '8-10',
    task: 'Respond to questions using information provided',
    criteria: ['all of the above'],
  },
  {
    key: '5',
    question: '11',
    task: 'Express an opinion',
    criteria: ['all of the above'],
  },
]

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

          <Table
            dataSource={dataSource}
            columns={columns}
            pagination={false}
            size="small"
            bordered
          />
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

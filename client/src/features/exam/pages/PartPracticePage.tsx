import { useParams, useNavigate } from 'react-router-dom'
import { Button, Card, Col, Empty, Flex, Row, Spin, Tag, Typography } from 'antd'
import { PlayCircleOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'

import { questionService } from '@/features/admin/services/question.service'
import { queryKeys } from '@/lib/query-keys'
import { PART_META } from '@/features/admin/types'
import type { PracticeSet, PartNumber } from '@/features/admin/types'
import { PageHeader } from '@/shared/components'

const { Text } = Typography

function SetCard({ set, onStart }: { set: PracticeSet; onStart: () => void }) {
  const { questions } = set
  const totalSeconds = questions.reduce((s, q) => s + q.prepTimeSeconds + q.responseTimeSeconds, 0)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const timeLabel =
    minutes > 0 ? `${minutes} phút${seconds > 0 ? ` ${seconds}s` : ''}` : `${seconds}s`

  return (
    <Card hoverable styles={{ body: { padding: '16px 20px' } }}>
      <Flex vertical gap={10}>
        <Flex align="center" justify="space-between">
          <Text strong style={{ fontSize: 15 }}>
            {set.examSetTitle}
          </Text>
          <Tag color="blue">{questions.length} câu</Tag>
        </Flex>

        <Text type="secondary" style={{ fontSize: 12 }}>
          Thời gian ước tính: {timeLabel}
        </Text>

        <Button
          type="primary"
          icon={<PlayCircleOutlined />}
          onClick={onStart}
          style={{ alignSelf: 'flex-start' }}
        >
          Bắt đầu luyện
        </Button>
      </Flex>
    </Card>
  )
}

export default function PartPracticePage() {
  const { partNumber } = useParams<{ partNumber: string }>()
  const navigate = useNavigate()
  const part = Number(partNumber) as PartNumber

  const meta = PART_META[part]

  const { data: sets = [], isLoading } = useQuery({
    queryKey: queryKeys.questions.practiceSets(part),
    queryFn: () => questionService.getPracticeSets(part),
    enabled: !!part && part >= 1 && part <= 5,
  })

  return (
    <>
      <PageHeader
        title={`Luyện ${meta?.label ?? ''}`}
        description={meta?.description}
        breadcrumbs={[
          { label: 'Luyện theo Part', href: '/practice' },
          { label: meta?.label ?? '' },
        ]}
      />

      {isLoading && (
        <Flex justify="center" style={{ padding: '48px 0' }}>
          <Spin size="large" />
        </Flex>
      )}

      {!isLoading && sets.length === 0 && (
        <Empty
          description="Chưa có bộ đề nào được công bố cho phần này"
          style={{ marginTop: 48 }}
        />
      )}

      {!isLoading && sets.length > 0 && (
        <Row gutter={[16, 16]}>
          {sets.map((set) => (
            <Col key={set.examSetId} xs={24} sm={12} lg={8}>
              <SetCard
                set={set}
                onStart={() => navigate(`/practice/part/${part}/set/${set.examSetId}`)}
              />
            </Col>
          ))}
        </Row>
      )}
    </>
  )
}

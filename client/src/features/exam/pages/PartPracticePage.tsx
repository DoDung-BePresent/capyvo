import { useParams, useNavigate } from 'react-router-dom'
import { Badge, Card, Col, Empty, Flex, Row, Spin, Tag, Typography } from 'antd'
import { CheckCircleFilled } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'

import { questionService } from '@/features/admin/services/question.service'
import { sessionService } from '@/features/exam/services/session.service'
import { queryKeys } from '@/lib/query-keys'
import { PART_META } from '@/features/admin/types'
import type { PracticeSet, PartNumber } from '@/features/admin/types'
import { PageHeader } from '@/shared/components'

const { Text } = Typography

function SetCard({
  set,
  isDone,
  onClick,
}: {
  set: PracticeSet
  isDone: boolean
  onClick: () => void
}) {
  const { questions } = set
  const totalSeconds = questions.reduce((s, q) => s + q.prepTimeSeconds + q.responseTimeSeconds, 0)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const timeLabel =
    minutes > 0 ? `${minutes} phút${seconds > 0 ? ` ${seconds}s` : ''}` : `${seconds}s`

  const card = (
    <Card hoverable styles={{ body: { padding: '16px 20px' } }} onClick={onClick}>
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
      </Flex>
    </Card>
  )

  if (!isDone) return card

  return (
    <Badge.Ribbon
      text={
        <Flex align="center" gap={4}>
          <CheckCircleFilled /> Hoàn thành
        </Flex>
      }
      color="green"
    >
      {card}
    </Badge.Ribbon>
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

  const { data: completedSetIds = [] } = useQuery({
    queryKey: queryKeys.practiceSessions.completedSetIds(),
    queryFn: () => sessionService.getCompletedSetIds(),
  })

  const completedSet = new Set(completedSetIds)

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
                isDone={completedSet.has(set.examSetId)}
                onClick={() => navigate(`/practice/part/${part}/set/${set.examSetId}`)}
              />
            </Col>
          ))}
        </Row>
      )}
    </>
  )
}

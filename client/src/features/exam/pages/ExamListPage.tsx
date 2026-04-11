import { useNavigate } from 'react-router-dom'
import { Row, Col, Card, Badge, Tag, Typography, Flex, Empty, Spin } from 'antd'
import { CheckCircleFilled } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'

import { examSetService } from '@/features/admin/services/exam-set.service'
import { sessionService } from '@/features/exam/services/session.service'
import { queryKeys } from '@/lib/query-keys'
import { PageHeader } from '@/shared/components'

const { Text } = Typography

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  PRACTICE: { label: 'Luyện tập', color: 'blue' },
  FORECAST: { label: 'Đề dự đoán', color: 'orange' },
  CUSTOM: { label: 'Tùy chỉnh', color: 'default' },
}

export default function ExamListPage() {
  const navigate = useNavigate()

  const { data: examSets = [], isLoading } = useQuery({
    queryKey: queryKeys.examSets.published(),
    queryFn: examSetService.getPublished,
  })

  const { data: completedSetIds = [] } = useQuery({
    queryKey: queryKeys.practiceSessions.completedSetIds(),
    queryFn: () => sessionService.getCompletedSetIds(),
  })

  const completedSet = new Set(completedSetIds)

  return (
    <>
      <PageHeader
        title="Thi thử"
        description="Các bộ đề thi thử đang mở — làm bài và nhận kết quả ngay sau khi hoàn thành."
      />

      {isLoading && (
        <Flex justify="center" style={{ padding: '48px 0' }}>
          <Spin size="large" />
        </Flex>
      )}

      {!isLoading && examSets.length === 0 && (
        <Empty description="Chưa có bộ đề nào được công bố" style={{ marginTop: 48 }} />
      )}

      {!isLoading && examSets.length > 0 && (
        <Row gutter={[16, 16]}>
          {examSets.map((set) => {
            const type = TYPE_LABELS[set.type] ?? TYPE_LABELS['CUSTOM']
            const count = set._count?.questions ?? 0
            const isDone = completedSet.has(set.id)

            const card = (
              <Card
                hoverable
                style={{ height: '100%' }}
                styles={{ body: { padding: '20px 24px' } }}
                onClick={() => navigate(`/exam/${set.id}`)}
              >
                <Flex vertical gap={10}>
                  <Flex align="center" justify="space-between">
                    <Tag color={type.color}>{type.label}</Tag>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {count} câu
                    </Text>
                  </Flex>

                  <Text strong style={{ fontSize: 15 }}>
                    {set.title}
                  </Text>

                  {set.description && (
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      {set.description}
                    </Text>
                  )}
                </Flex>
              </Card>
            )

            return (
              <Col key={set.id} xs={24} sm={12} lg={8}>
                {isDone ? (
                  <Badge.Ribbon
                    text={
                      <Flex align="center" gap={4}>
                        <CheckCircleFilled /> Đã làm
                      </Flex>
                    }
                    color="green"
                  >
                    {card}
                  </Badge.Ribbon>
                ) : (
                  card
                )}
              </Col>
            )
          })}
        </Row>
      )}
    </>
  )
}

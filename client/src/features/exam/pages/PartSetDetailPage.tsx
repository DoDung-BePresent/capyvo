import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Button, Card, Empty, Flex, List, Spin, Statistic, Tag, Typography } from 'antd'
import {
  CheckCircleFilled,
  ClockCircleOutlined,
  PlayCircleOutlined,
  TeamOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'

import { questionService } from '@/features/admin/services/question.service'
import { sessionService } from '@/features/exam/services/session.service'
import { queryKeys } from '@/lib/query-keys'
import { PART_META } from '@/features/admin/types'
import type { PartNumber } from '@/features/admin/types'
import { PageHeader } from '@/shared/components'

const { Text, Title } = Typography

export default function PartSetDetailPage() {
  const { partNumber, examSetId } = useParams<{ partNumber: string; examSetId: string }>()
  const navigate = useNavigate()
  const part = Number(partNumber) as PartNumber
  const setId = examSetId ?? ''

  const meta = PART_META[part]

  const { data: sets = [], isLoading: isLoadingSets } = useQuery({
    queryKey: queryKeys.questions.practiceSets(part),
    queryFn: () => questionService.getPracticeSets(part),
    enabled: !!part,
  })

  const currentSet = sets.find((s) => s.examSetId === setId)

  const { data: sessions = [], isLoading: isLoadingSessions } = useQuery({
    queryKey: queryKeys.practiceSessions.myBySet(setId),
    queryFn: () => sessionService.getMySessionsBySet(setId),
    enabled: !!setId,
  })

  const { data: stats } = useQuery({
    queryKey: queryKeys.practiceSessions.setStats(setId),
    queryFn: () => sessionService.getSetStats(setId),
    enabled: !!setId,
  })

  if (isLoadingSets) {
    return (
      <Flex justify="center" style={{ padding: '80px 0' }}>
        <Spin size="large" />
      </Flex>
    )
  }

  if (!currentSet) {
    return <Empty description="Không tìm thấy bộ đề" style={{ marginTop: 80 }} />
  }

  const { questions } = currentSet
  const totalSeconds = questions.reduce((s, q) => s + q.prepTimeSeconds + q.responseTimeSeconds, 0)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const timeLabel =
    minutes > 0 ? `${minutes} phút${seconds > 0 ? ` ${seconds}s` : ''}` : `${seconds}s`
  const completedSessions = sessions.filter((s) => s.status === 'COMPLETED')
  const hasCompleted = completedSessions.length > 0

  return (
    <>
      <PageHeader
        title={currentSet.examSetTitle}
        description={meta?.description}
        breadcrumbs={[
          { label: 'Luyện theo Part', href: '/practice' },
          { label: meta?.label ?? '', href: `/practice/part/${part}` },
          { label: currentSet.examSetTitle },
        ]}
      />

      {/* Stats row */}
      <Flex gap={16} wrap style={{ marginBottom: 24 }}>
        <Card styles={{ body: { padding: '16px 24px' } }}>
          <Statistic
            title="Số câu hỏi"
            value={questions.length}
            prefix={<UnorderedListOutlined />}
          />
        </Card>
        <Card styles={{ body: { padding: '16px 24px' } }}>
          <Statistic
            title="Thời gian ước tính"
            value={timeLabel}
            prefix={<ClockCircleOutlined />}
          />
        </Card>
        <Card styles={{ body: { padding: '16px 24px' } }}>
          <Statistic
            title="Lượt làm (cộng đồng)"
            value={stats?.totalAttempts ?? 0}
            prefix={<TeamOutlined />}
          />
        </Card>
        {hasCompleted && (
          <Card styles={{ body: { padding: '16px 24px' } }}>
            <Statistic
              title="Lượt bạn đã làm"
              value={completedSessions.length}
              prefix={<CheckCircleFilled style={{ color: '#52c41a' }} />}
            />
          </Card>
        )}
      </Flex>

      {/* Start button */}
      <Button
        type="primary"
        size="large"
        icon={<PlayCircleOutlined />}
        onClick={() => navigate(`/practice/part/${part}/set/${setId}/exam`)}
        style={{ marginBottom: 32 }}
      >
        {hasCompleted ? 'Làm lại' : 'Bắt đầu luyện'}
      </Button>

      {/* History */}
      <Title level={5} style={{ marginBottom: 12 }}>
        Lịch sử luyện tập
      </Title>

      {isLoadingSessions && <Spin />}

      {!isLoadingSessions && sessions.length === 0 && (
        <Empty description="Bạn chưa thực hiện bài luyện nào" style={{ marginTop: 24 }} />
      )}

      {!isLoadingSessions && sessions.length > 0 && (
        <List
          dataSource={sessions}
          renderItem={(session, index) => (
            <List.Item
              style={{ padding: '12px 0' }}
              actions={
                session.status === 'COMPLETED'
                  ? [
                      <Link key="view" to={`/result/${session.id}`}>
                        Xem kết quả
                      </Link>,
                    ]
                  : undefined
              }
            >
              <List.Item.Meta
                title={
                  <Flex align="center" gap={8}>
                    <Text>Lần {sessions.length - index}</Text>
                    {session.status === 'COMPLETED' ? (
                      <Tag color="success" icon={<CheckCircleFilled />}>
                        Hoàn thành
                      </Tag>
                    ) : (
                      <Tag color="warning">Chưa hoàn thành</Tag>
                    )}
                  </Flex>
                }
                description={
                  <Flex gap={16}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {dayjs(session.startedAt).format('DD/MM/YYYY HH:mm')}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {session._count.userResponses}/{questions.length} câu đã ghi âm
                    </Text>
                  </Flex>
                }
              />
            </List.Item>
          )}
        />
      )}
    </>
  )
}

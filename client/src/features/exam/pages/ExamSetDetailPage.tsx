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

import { examSetService } from '@/features/admin/services/exam-set.service'
import { sessionService } from '@/features/exam/services/session.service'
import { queryKeys } from '@/lib/query-keys'
import { PageHeader } from '@/shared/components'

const { Text, Title } = Typography

const TYPE_LABELS: Record<string, string> = {
  PRACTICE: 'Luyện tập',
  FORECAST: 'Đề dự đoán',
  CUSTOM: 'Tùy chỉnh',
}

export default function ExamSetDetailPage() {
  const { examSetId } = useParams<{ examSetId: string }>()
  const navigate = useNavigate()
  const setId = examSetId ?? ''

  const { data: examSet, isLoading: isLoadingSet } = useQuery({
    queryKey: queryKeys.examSets.publishedDetail(setId),
    queryFn: () => examSetService.getPublishedById(setId),
    enabled: !!setId,
  })

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

  if (isLoadingSet) {
    return (
      <Flex justify="center" style={{ padding: '80px 0' }}>
        <Spin size="large" />
      </Flex>
    )
  }

  if (!examSet) {
    return <Empty description="Không tìm thấy bộ đề" style={{ marginTop: 80 }} />
  }

  const questionCount = examSet._count?.questions ?? examSet.questions?.length ?? 0
  const completedSessions = sessions.filter((s) => s.status === 'COMPLETED')
  const hasCompleted = completedSessions.length > 0

  return (
    <>
      <PageHeader
        title={examSet.title}
        description={examSet.description ?? undefined}
        breadcrumbs={[{ label: 'Thi thử', href: '/exam' }, { label: examSet.title }]}
      />

      {/* Stats row */}
      <Flex gap={16} wrap style={{ marginBottom: 24 }}>
        <Card styles={{ body: { padding: '16px 24px' } }}>
          <Statistic title="Số câu hỏi" value={questionCount} prefix={<UnorderedListOutlined />} />
        </Card>
        <Card styles={{ body: { padding: '16px 24px' } }}>
          <Statistic
            title="Loại đề"
            value={TYPE_LABELS[examSet.type] ?? examSet.type}
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
        onClick={() => navigate(`/exam/${setId}/take`)}
        style={{ marginBottom: 32 }}
      >
        {hasCompleted ? 'Thi lại' : 'Bắt đầu thi'}
      </Button>

      {/* History */}
      <Title level={5} style={{ marginBottom: 12 }}>
        Lịch sử làm bài
      </Title>

      {isLoadingSessions && <Spin />}

      {!isLoadingSessions && sessions.length === 0 && (
        <Empty description="Bạn chưa thực hiện bộ đề này" style={{ marginTop: 24 }} />
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
                      {session._count.userResponses}/{questionCount} câu đã ghi âm
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

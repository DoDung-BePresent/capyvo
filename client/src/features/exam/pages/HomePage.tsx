import { useMemo } from 'react'
import { Card, Flex, Space, Typography, Row, Col } from 'antd'
import { useSession } from '@/features/auth/hooks/useSession'
import { useGetMe } from '@/features/auth/hooks/useAuth'
import { useActivity } from '@/features/exam/hooks/useActivity'
import { Heatmap, StreakWidget } from '@/shared/components'

const { Title, Text } = Typography

// ─── Page ─── //
export default function HomePage() {
  const { session } = useSession()
  const { data: user } = useGetMe(session)
  const { data: activity } = useActivity(!!session)

  const activityByDate = useMemo(() => {
    if (!activity?.activityByDate) return new Map<string, number>()
    return new Map(Object.entries(activity.activityByDate))
  }, [activity])

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <div>
        <Title level={3} style={{ margin: 0 }}>
          Xin chào{user?.fullName ? `, ${user.fullName}` : ''} 👋
        </Title>
        <Text type="secondary">Hôm nay bạn muốn luyện tập phần nào?</Text>
      </div>

      <Row gutter={[16, 16]}>
        {/* Streak Widget */}
        <Col xs={24} lg={8}>
          <StreakWidget
            currentStreak={activity?.currentStreak ?? 0}
            longestStreak={activity?.longestStreak ?? 0}
          />
        </Col>

        {/* Heatmap */}
        <Col xs={24} lg={16}>
          <Card
            title={
              <Flex align="baseline" gap={8}>
                <Text strong>Hoạt động luyện tập</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  (3 tháng qua)
                </Text>
              </Flex>
            }
            styles={{
              body: {
                paddingLeft: 20,
              },
            }}
            className="w-fit! rounded-lg!"
          >
            <Heatmap activityByDate={activityByDate} />
          </Card>
        </Col>
      </Row>
    </Space>
  )
}

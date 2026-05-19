/**
 * Hooks
 */
import { useMemo, useState, useEffect } from 'react'

/**
 * Components
 */
import { Card, Flex, Space, Typography, Row, Col } from 'antd'
import { Heatmap, StreakWidget, GoalsWidget, ExamCountdownWidget } from '@/shared/components'

/**
 * Hooks
 */
import { useSession } from '@/features/auth/hooks/useSession'
import { useGetMe } from '@/features/auth/hooks/useAuth'
import { useActivity } from '@/features/exam/hooks/useActivity'

const { Title, Text } = Typography

export default function HomePage() {
  const { session } = useSession()
  const { data: user } = useGetMe(session)
  const { data: activity } = useActivity(!!session)

  // Load exam date and target score from localStorage
  const [examDate, setExamDate] = useState<string | null>(() => {
    return localStorage.getItem('examDate')
  })

  const [targetScore, setTargetScore] = useState<number>(() => {
    const saved = localStorage.getItem('targetScore')
    return saved ? parseInt(saved, 10) : 150 // Default target: 150
  })

  // Save to localStorage when changed
  useEffect(() => {
    if (examDate) {
      localStorage.setItem('examDate', examDate)
    } else {
      localStorage.removeItem('examDate')
    }
  }, [examDate])

  useEffect(() => {
    localStorage.setItem('targetScore', targetScore.toString())
  }, [targetScore])

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
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <StreakWidget
              currentStreak={activity?.currentStreak ?? 0}
              longestStreak={activity?.longestStreak ?? 0}
            />
            <Row gutter={16}>
              <Col span={12}>
                <GoalsWidget targetScore={targetScore} onTargetScoreChange={setTargetScore} />
              </Col>
              <Col span={12}>
                <ExamCountdownWidget examDate={examDate} onExamDateChange={setExamDate} />
              </Col>
            </Row>
          </Space>
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
            className="rounded-lg! transition-all! duration-150! ease-out! hover:translate-y-1!"
            style={{
              boxShadow: '0 4px 0 0 rgba(0, 0, 0, 0.08)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = 'none'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 0 0 rgba(0, 0, 0, 0.08)'
            }}
          >
            <Heatmap activityByDate={activityByDate} />
          </Card>
        </Col>
      </Row>
    </Space>
  )
}

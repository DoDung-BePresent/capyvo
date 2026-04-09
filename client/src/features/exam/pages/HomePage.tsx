import { useMemo } from 'react'
import { Card, Flex, Space, Typography } from 'antd'
import { useSession } from '@/features/auth/hooks/useSession'
import { useGetMe } from '@/features/auth/hooks/useAuth'
import { Heatmap } from '@/shared/components'

const { Title, Text } = Typography

// ─── Page ─── //
export default function HomePage() {
  const { session } = useSession()
  const { data: user } = useGetMe(session)

  // TODO: replace with real practice session data when API is ready
  const activityByDate = useMemo(() => new Map<string, number>(), [])

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <div>
        <Title level={3} style={{ margin: 0 }}>
          Xin chào{user?.fullName ? `, ${user.fullName}` : ''} 👋
        </Title>
        <Text type="secondary">Hôm nay bạn muốn luyện tập phần nào?</Text>
      </div>

      <Card
        title={
          <Flex align="baseline" gap={8}>
            <Text strong>Hoạt động luyện tập</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              (12 tháng qua)
            </Text>
          </Flex>
        }
        styles={{
          body: {
            paddingLeft: 10,
          },
        }}
        className="w-fit"
      >
        <Heatmap activityByDate={activityByDate} />
      </Card>
    </Space>
  )
}

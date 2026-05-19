import { Card, Flex, Typography, Statistic } from 'antd'
import { FireFilled, TrophyFilled } from '@ant-design/icons'
import { COLORS } from '@/shared/constants/user-color'
import { hexToRgba } from '@/shared/utils/color'

const { Text } = Typography

interface StreakWidgetProps {
  currentStreak: number
  longestStreak: number
}

export function StreakWidget({ currentStreak, longestStreak }: StreakWidgetProps) {
  return (
    <Card
      className="rounded-lg! transition-all! duration-150! ease-out! hover:translate-y-1!"
      style={{
        boxShadow: `0 4px 0 0 ${hexToRgba(COLORS.primary, 0.2)}`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = 'none'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = `0 4px 0 0 ${hexToRgba(COLORS.primary, 0.2)}`
      }}
    >
      <Flex gap={24}>
        {/* Current Streak */}
        <Flex vertical align="center" style={{ flex: 1 }}>
          <FireFilled style={{ fontSize: 32, color: COLORS.accent, marginBottom: 8 }} />
          <Statistic
            value={currentStreak}
            suffix="ngày"
            valueStyle={{ fontSize: 24, fontWeight: 700, color: COLORS.accent }}
          />
          <Text type="secondary" style={{ fontSize: 12 }}>
            Chuỗi hiện tại
          </Text>
        </Flex>

        {/* Divider */}
        <div style={{ width: 1, backgroundColor: '#f0f0f0' }} />

        {/* Longest Streak */}
        <Flex vertical align="center" style={{ flex: 1 }}>
          <TrophyFilled style={{ fontSize: 32, color: COLORS.primary, marginBottom: 8 }} />
          <Statistic
            value={longestStreak}
            suffix="ngày"
            valueStyle={{ fontSize: 24, fontWeight: 700, color: COLORS.primary }}
          />
          <Text type="secondary" style={{ fontSize: 12 }}>
            Chuỗi dài nhất
          </Text>
        </Flex>
      </Flex>
    </Card>
  )
}

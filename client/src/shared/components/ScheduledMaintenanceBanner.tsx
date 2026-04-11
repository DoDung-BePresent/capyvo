import { Alert, Typography } from 'antd'
import { ClockCircleOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useMaintenance } from '@/shared/hooks/useMaintenance'

const { Text } = Typography

export function ScheduledMaintenanceBanner() {
  const { isMaintenance, schedule } = useMaintenance()

  // Only show when: not currently in maintenance AND there's a future start time
  if (isMaintenance || !schedule?.start) return null

  const startDate = new Date(schedule.start)
  if (startDate <= new Date()) return null

  const endText = schedule.end
    ? ` — kết thúc lúc ${dayjs(schedule.end).format('HH:mm DD/MM/YYYY')}`
    : ''

  const noticeText = schedule.message || 'Hệ thống sẽ tạm ngưng để bảo trì'

  return (
    <Alert
      icon={<ClockCircleOutlined />}
      description={
        <span>
          <Text strong>Thông báo bảo trì: </Text>
          {noticeText}. Bắt đầu lúc{' '}
          <Text strong>{dayjs(schedule.start).format('HH:mm DD/MM/YYYY')}</Text>
          {endText}.
        </span>
      }
      type="warning"
      showIcon
      banner
      closable
      styles={{ root: { padding: '6px 16px' } }}
    />
  )
}

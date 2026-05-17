import { Result, Button, Flex, Typography, Space } from 'antd'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { cn } from '../utils/cn'

const { Text } = Typography

export function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <Flex className="min-h-dvh" vertical align="center" justify="center">
      <Result
        status="404"
        title="404"
        subTitle="Trang bạn tìm kiếm không tồn tại."
        extra={
          <Button type="primary" onClick={() => navigate(-1)}>
            Quay lại
          </Button>
        }
      />
    </Flex>
  )
}

export function ForbiddenPage() {
  const navigate = useNavigate()
  return (
    <Flex className="min-h-dvh" vertical align="center" justify="center">
      <Result
        status="403"
        title="403"
        subTitle="Bạn không có quyền truy cập trang này."
        extra={
          <Button type="primary" onClick={() => navigate('/')}>
            Về trang chủ
          </Button>
        }
      />
    </Flex>
  )
}

interface MaintenancePageProps {
  endTime?: string | null
  message?: string
  className?: string
}

export function MaintenancePage({ endTime, message, className }: MaintenancePageProps = {}) {
  const subTitle = message || 'Hệ thống đang được bảo trì, vui lòng quay lại sau.'

  const extra = (
    <Space direction="vertical" align="center">
      {endTime && (
        <Text type="secondary">
          Dự kiến hoàn thành lúc: <Text strong>{dayjs(endTime).format('HH:mm DD/MM/YYYY')}</Text>
        </Text>
      )}
      <Button type="primary" onClick={() => window.location.reload()}>
        Thử lại
      </Button>
    </Space>
  )

  return (
    <Flex className={cn('min-h-dvh', className)} vertical align="center" justify="center">
      <Result status="500" title="Đang bảo trì" subTitle={subTitle} extra={extra} />
    </Flex>
  )
}

export function ServerErrorPage() {
  return (
    <Flex className="min-h-dvh" vertical align="center" justify="center">
      <Result
        status="500"
        title="500"
        subTitle="Lỗi máy chủ. Vui lòng thử lại sau hoặc liên hệ hỗ trợ."
        extra={
          <Button type="primary" onClick={() => window.location.reload()}>
            Thử lại
          </Button>
        }
      />
    </Flex>
  )
}

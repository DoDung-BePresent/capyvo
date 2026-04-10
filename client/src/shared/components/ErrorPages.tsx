import { Result, Button, Flex } from 'antd'
import { useNavigate } from 'react-router-dom'

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

export function MaintenancePage() {
  return (
    <Flex className="min-h-dvh" vertical align="center" justify="center">
      <Result
        status="500"
        title="Đang bảo trì"
        subTitle="Hệ thống đang được bảo trì, vui lòng quay lại sau."
        extra={
          <Button type="primary" onClick={() => window.location.reload()}>
            Thử lại
          </Button>
        }
      />
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

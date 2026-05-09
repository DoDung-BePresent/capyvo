import { Button, Card, Flex } from 'antd'
import { WorkspacePremium } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'

export function UpgradeCTA() {
  const navigate = useNavigate()

  return (
    <Card
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        border: 'none',
        marginTop: 16,
      }}
      bodyStyle={{ padding: 20 }}
    >
      <Flex align="center" gap={16}>
        <WorkspacePremium style={{ fontSize: 40, color: '#fff', flexShrink: 0 }} />
        <Flex vertical gap={8} style={{ flex: 1 }}>
          <h4 style={{ color: '#fff', fontSize: 15, fontWeight: 600, margin: 0 }}>
            Nâng cấp Premium để nhận phân tích AI
          </h4>
          <p
            style={{
              color: 'rgba(255, 255, 255, 0.85)',
              fontSize: 13,
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            Nhận điểm số chi tiết, phân tích lỗi cụ thể, và feedback từ AI
          </p>
        </Flex>
        <Button
          type="primary"
          size="middle"
          onClick={() => navigate('/pricing')}
          style={{
            backgroundColor: '#fff',
            color: '#667eea',
            border: 'none',
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          Nâng cấp
        </Button>
      </Flex>
    </Card>
  )
}

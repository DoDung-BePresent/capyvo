import { useNavigate } from 'react-router-dom'
import { Card, Row, Col, Typography } from 'antd'
import { EditOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

export default function AdminDashboardPage() {
  const navigate = useNavigate()

  return (
    <div style={{ maxWidth: 900, margin: '48px auto', padding: '0 16px' }}>
      <Title level={3}>Admin Dashboard</Title>
      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col>
          <Card hoverable style={{ width: 240 }} onClick={() => navigate('/admin/questions')}>
            <EditOutlined style={{ fontSize: 28, color: '#4F46E5', marginBottom: 12 }} />
            <Title level={5} style={{ margin: '0 0 4px' }}>
              Quản lý câu hỏi
            </Title>
            <Text type="secondary">Thêm, sửa câu hỏi cho 5 part</Text>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

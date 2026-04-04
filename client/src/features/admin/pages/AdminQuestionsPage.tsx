import { useNavigate } from 'react-router-dom'
import { Row, Col, Card, Typography, Tag, Space } from 'antd'
import { RightOutlined } from '@ant-design/icons'
import { PART_META } from '../types'
import type { PartNumber } from '../types'

const { Title, Text } = Typography

export default function AdminQuestionsPage() {
  const navigate = useNavigate()

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <div>
        <Title level={3} style={{ margin: 0 }}>
          Quản lý câu hỏi
        </Title>
        <Text type="secondary">Chọn một Part để thêm và xem câu hỏi.</Text>
      </div>

      <Row gutter={[16, 16]}>
        {(Object.entries(PART_META) as [string, (typeof PART_META)[PartNumber]][]).map(
          ([key, meta]) => {
            const partNum = Number(key) as PartNumber
            return (
              <Col xs={24} sm={12} md={8} key={partNum}>
                <Card
                  hoverable
                  onClick={() => navigate(`/admin/questions/part/${partNum}`)}
                  style={{
                    borderTop: `3px solid ${meta.color}`,
                    height: '100%',
                    cursor: 'pointer',
                  }}
                >
                  <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                    <Tag color={meta.color}>{meta.label}</Tag>
                    <RightOutlined style={{ color: '#aaa' }} />
                  </Space>
                  <Title level={5} style={{ margin: '8px 0 4px' }}>
                    {meta.description}
                  </Title>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Câu {meta.questionNumbers.join(', ')}
                  </Text>
                  <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {'partPrepTime' in meta && (
                      <Tag>Prep chung: {(meta as { partPrepTime: number }).partPrepTime}s</Tag>
                    )}
                    <Tag>Prep: {meta.prepTime}s</Tag>
                    <Tag>Response: {meta.responseTime}s</Tag>
                    {'responseTimeOverride' in meta && (
                      <Tag color="orange">
                        Câu{' '}
                        {Object.keys(
                          (meta as { responseTimeOverride: Record<number, number> })
                            .responseTimeOverride,
                        ).join('/')}
                        :{' '}
                        {Object.values(
                          (meta as { responseTimeOverride: Record<number, number> })
                            .responseTimeOverride,
                        ).join('/')}
                        s
                      </Tag>
                    )}
                  </div>
                </Card>
              </Col>
            )
          },
        )}
      </Row>
    </Space>
  )
}

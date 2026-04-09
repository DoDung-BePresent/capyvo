import { useNavigate } from 'react-router-dom'
import { Row, Col, Card, Button, Typography, Tag, Flex } from 'antd'
import { PlayCircleOutlined } from '@ant-design/icons'
import { PageHeader } from '@/shared/components'
import { PART_META } from '@/features/admin/types'
import type { PartNumber } from '@/features/admin/types'

const { Text } = Typography

const PART_NUMBERS: PartNumber[] = [1, 2, 3, 4, 5]

export default function PracticePage() {
  const navigate = useNavigate()

  return (
    <>
      <PageHeader
        title="Luyện theo Part"
        description="Chọn phần muốn luyện tập — hệ thống sẽ chạy toàn bộ câu hỏi của part đó."
      />

      <Row gutter={[16, 16]}>
        {PART_NUMBERS.map((part) => {
          const meta = PART_META[part]
          return (
            <Col key={part} xs={24} sm={12} lg={8}>
              <Card
                hoverable
                style={{ borderLeft: `4px solid ${meta.color}`, height: '100%' }}
                styles={{ body: { padding: '20px 24px' } }}
              >
                <Flex vertical gap={12}>
                  <Flex align="center" justify="space-between">
                    <Tag color={meta.color} style={{ fontWeight: 600, fontSize: 13 }}>
                      {meta.label}
                    </Tag>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {meta.questionNumbers.length} câu •{' '}
                      {meta.questionNumbers
                        .map((n) => n)
                        .reduce(
                          (_, __, i, arr) =>
                            i === 0 ? `Câu ${arr[0]}` : i === arr.length - 1 ? `${_}–${arr[i]}` : _,
                          '',
                        )}
                    </Text>
                  </Flex>

                  <Text style={{ fontSize: 14, lineHeight: 1.6 }}>{meta.description}</Text>

                  <Button
                    type="primary"
                    icon={<PlayCircleOutlined />}
                    onClick={() => navigate(`/practice/part/${part}`)}
                    style={{ alignSelf: 'flex-start', marginTop: 4 }}
                  >
                    Bắt đầu luyện
                  </Button>
                </Flex>
              </Card>
            </Col>
          )
        })}
      </Row>
    </>
  )
}

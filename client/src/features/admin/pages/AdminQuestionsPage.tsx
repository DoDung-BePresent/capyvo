import { useState } from 'react'
import { Row, Col, Card, Typography, Tag, Modal, App } from 'antd'
import { PART_META } from '../types'
import Part1Form from '../components/Part1Form'
import Part2Form from '../components/Part2Form'
import Part3Form from '../components/Part3Form'
import Part4Form from '../components/Part4Form'
import Part5Form from '../components/Part5Form'

const { Title, Text } = Typography

type PartNumber = 1 | 2 | 3 | 4 | 5

export default function AdminQuestionsPage() {
  const { message } = App.useApp()
  const [activePart, setActivePart] = useState<PartNumber | null>(null)

  const handleSubmit = (partNumber: PartNumber) => (values: unknown) => {
    // TODO: gọi API tạo câu hỏi
    console.log(`Part ${partNumber}:`, values)
    message.success(`Lưu câu hỏi Part ${partNumber} thành công!`)
    setActivePart(null)
  }

  return (
    <div style={{ maxWidth: 900, margin: '48px auto', padding: '0 16px' }}>
      <Title level={3} style={{ marginBottom: 8 }}>
        Quản lý câu hỏi
      </Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 32 }}>
        Chọn một Part để thêm câu hỏi tương ứng vào hệ thống.
      </Text>

      <Row gutter={[16, 16]}>
        {(Object.entries(PART_META) as [string, (typeof PART_META)[1]][]).map(([key, meta]) => {
          const partNum = Number(key) as PartNumber
          return (
            <Col xs={24} sm={12} md={8} key={partNum}>
              <Card
                hoverable
                onClick={() => setActivePart(partNum)}
                style={{ borderTop: `3px solid ${meta.color}`, height: '100%' }}
              >
                <Tag color={meta.color} style={{ marginBottom: 12 }}>
                  {meta.label}
                </Tag>
                <Title level={5} style={{ margin: '0 0 6px' }}>
                  {meta.description}
                </Title>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Câu {meta.questionNumbers.join(', ')}
                </Text>
                <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {'partPrepTime' in meta && (
                    <Tag>Prep chung: {(meta as { partPrepTime: number }).partPrepTime}s</Tag>
                  )}
                  <Tag>Prep/câu: {meta.prepTime}s</Tag>
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
        })}
      </Row>

      <Modal
        open={activePart !== null}
        onCancel={() => setActivePart(null)}
        footer={null}
        title={activePart ? `Thêm câu hỏi — ${PART_META[activePart].label}` : ''}
        width={600}
        destroyOnHidden
      >
        {activePart === 1 && <Part1Form onSubmit={handleSubmit(1)} />}
        {activePart === 2 && <Part2Form onSubmit={handleSubmit(2)} />}
        {activePart === 3 && <Part3Form onSubmit={handleSubmit(3)} />}
        {activePart === 4 && <Part4Form onSubmit={handleSubmit(4)} />}
        {activePart === 5 && <Part5Form onSubmit={handleSubmit(5)} />}
      </Modal>
    </div>
  )
}

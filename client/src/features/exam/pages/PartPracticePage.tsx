import { useParams, useNavigate } from 'react-router-dom'
import { Button, Card, Descriptions, Flex, Result } from 'antd'
import { PlayCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'

import { questionService } from '@/features/admin/services/question.service'
import { queryKeys } from '@/lib/query-keys'
import { PART_META } from '@/features/admin/types'
import type { PartNumber } from '@/features/admin/types'
import { PageHeader } from '@/shared/components'

export default function PartPracticePage() {
  const { partNumber } = useParams<{ partNumber: string }>()
  const navigate = useNavigate()
  const part = Number(partNumber) as PartNumber

  const meta = PART_META[part]
  const { data: questions = [], isLoading } = useQuery({
    queryKey: queryKeys.questions.byPart(part),
    queryFn: () => questionService.getByPart(part),
    enabled: !!part && part >= 1 && part <= 5,
  })

  if (!meta) {
    return (
      <Result
        status="404"
        title="Part không tồn tại"
        extra={<Button onClick={() => navigate('/practice')}>Quay lại</Button>}
      />
    )
  }

  const totalPrepTime = questions.reduce((s, q) => s + q.prepTimeSeconds, 0)
  const totalResponseTime = questions.reduce((s, q) => s + q.responseTimeSeconds, 0)
  const totalSeconds = totalPrepTime + totalResponseTime

  const formatMin = (s: number) => {
    const m = Math.floor(s / 60)
    const rem = s % 60
    return m > 0 ? `${m} phút${rem > 0 ? ` ${rem} giây` : ''}` : `${rem} giây`
  }

  return (
    <>
      <PageHeader
        title={`Luyện ${meta.label}`}
        description={meta.description}
        breadcrumbs={[{ label: 'Luyện theo Part', href: '/practice' }, { label: meta.label }]}
      />

      <Card style={{ maxWidth: 560 }} loading={isLoading}>
        <Descriptions column={1} size="small" styles={{ label: { width: 160 } }}>
          <Descriptions.Item label="Số câu hỏi">{questions.length} câu</Descriptions.Item>
          <Descriptions.Item label="Tổng thời gian chuẩn bị">
            {formatMin(totalPrepTime)}
          </Descriptions.Item>
          <Descriptions.Item label="Tổng thời gian trả lời">
            {formatMin(totalResponseTime)}
          </Descriptions.Item>
          <Descriptions.Item label="Tổng thời gian">{formatMin(totalSeconds)}</Descriptions.Item>
        </Descriptions>

        <Flex gap={12} style={{ marginTop: 24 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/practice')}>
            Quay lại
          </Button>
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            disabled={questions.length === 0}
            onClick={() => navigate(`/practice/part/${part}/start`)}
          >
            Bắt đầu
          </Button>
        </Flex>
      </Card>
    </>
  )
}

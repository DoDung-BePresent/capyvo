import { Row, Col } from 'antd'

/**
 * Hooks
 */
import { useNavigate } from 'react-router-dom'

/**
 * Components
 */
import { PageHeader } from '@/shared/components'
import PartCard from './components/PartCard'

/**
 * Configs
 */
import { PART_CONFIGS } from '@/features/exam/config/part-config'

/**
 * Types
 */
import type { PartNumber } from '@/shared/types/domain'

const PART_NUMBERS: PartNumber[] = [1, 2, 3, 4, 5]

export default function PracticePage() {
  const navigate = useNavigate()

  // TODO: Lấy progress từ API/localStorage
  // Ví dụ mock data:
  const partProgress: Record<PartNumber, number> = {
    1: 65, // 65% hoàn thành
    2: 30,
    3: 0,
    4: 0,
    5: 0,
  }

  return (
    <>
      <PageHeader
        title="Luyện theo Part"
        description="Chọn phần muốn luyện tập — hệ thống sẽ chạy toàn bộ câu hỏi của part đó."
      />

      <Row gutter={[16, 16]}>
        {PART_NUMBERS.map((part) => {
          const config = PART_CONFIGS[part]
          return (
            <Col key={part} xs={24} sm={12} lg={8}>
              <PartCard
                partNumber={config.partNumber}
                label={config.label}
                title={config.title}
                description={config.description}
                questionInfo={`${config.questionCount} câu • ${config.questionRange}`}
                color={config.color}
                icon={config.icon}
                progress={partProgress[part]}
                onStart={() => navigate(`/practice/part/${part}`)}
              />
            </Col>
          )
        })}
      </Row>
    </>
  )
}

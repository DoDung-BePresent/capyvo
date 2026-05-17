import { Tag } from 'antd'
import { QuestionType } from '@/features/admin/types'

interface TypeTagProps {
  type: QuestionType
}

export function TypeTag({ type }: TypeTagProps) {
  const colorMap: Record<QuestionType, string> = {
    [QuestionType.PRACTICE]: 'blue',
    [QuestionType.FORECAST]: 'orange',
    [QuestionType.CUSTOM]: 'purple',
  }
  return <Tag color={colorMap[type]}>{type}</Tag>
}

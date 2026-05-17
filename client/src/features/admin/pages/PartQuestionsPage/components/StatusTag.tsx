import { Tag } from 'antd'
import { QuestionStatus } from '@/features/admin/types'

interface StatusTagProps {
  status: QuestionStatus
}

export function StatusTag({ status }: StatusTagProps) {
  const colorMap: Record<QuestionStatus, string> = {
    [QuestionStatus.DRAFT]: 'default',
    [QuestionStatus.PUBLISHED]: 'green',
    [QuestionStatus.ARCHIVED]: 'red',
  }
  return <Tag color={colorMap[status]}>{status}</Tag>
}

import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

import { questionService } from '@/features/admin/services/question.service'
import { queryKeys } from '@/lib/query-keys'
import { ExamRunner } from '../components/ExamRunner'

export default function PartExamPage() {
  const { partNumber } = useParams<{ partNumber: string }>()
  const navigate = useNavigate()
  const part = Number(partNumber)

  const { data: questions = [], isLoading } = useQuery({
    queryKey: queryKeys.questions.byPart(part),
    queryFn: () => questionService.getByPart(part),
    enabled: !!part,
  })

  return (
    <ExamRunner
      questions={questions}
      isLoading={isLoading}
      onDone={() => navigate('/practice', { replace: true })}
    />
  )
}

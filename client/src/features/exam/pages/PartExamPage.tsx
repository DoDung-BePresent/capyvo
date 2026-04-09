import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

import { questionService } from '@/features/admin/services/question.service'
import { queryKeys } from '@/lib/query-keys'
import { ExamRunner } from '../components/ExamRunner'

export default function SetExamPage() {
  const { leaderId } = useParams<{ leaderId: string }>()
  const navigate = useNavigate()

  const { data: questions = [], isLoading } = useQuery({
    queryKey: queryKeys.questions.set(leaderId ?? ''),
    queryFn: () => questionService.getSetByLeader(leaderId ?? ''),
    enabled: !!leaderId,
  })

  return (
    <ExamRunner
      questions={questions}
      isLoading={isLoading}
      onDone={() => navigate('/practice', { replace: true })}
    />
  )
}

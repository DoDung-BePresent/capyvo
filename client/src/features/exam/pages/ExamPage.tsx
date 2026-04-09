import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

import { examSetService } from '@/features/admin/services/exam-set.service'
import { queryKeys } from '@/lib/query-keys'
import { ExamRunner } from '../components/ExamRunner'

export default function ExamPage() {
  const { examSetId } = useParams<{ examSetId: string }>()
  const navigate = useNavigate()

  const { data: examSet, isLoading } = useQuery({
    queryKey: queryKeys.examSets.publishedDetail(examSetId ?? ''),
    queryFn: () => examSetService.getPublishedById(examSetId ?? ''),
    enabled: !!examSetId,
  })

  return (
    <ExamRunner
      questions={examSet?.questions ?? []}
      isLoading={isLoading}
      onDone={() => navigate('/', { replace: true })}
    />
  )
}

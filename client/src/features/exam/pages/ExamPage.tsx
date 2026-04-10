import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

import { examSetService } from '@/features/admin/services/exam-set.service'
import { queryKeys } from '@/lib/query-keys'
import { ExamRunner } from '../components/ExamRunner'
import { MicPermissionGate } from '../components/MicPermissionGate'

export default function ExamPage() {
  const { examSetId } = useParams<{ examSetId: string }>()
  const navigate = useNavigate()

  const { data: examSet, isLoading } = useQuery({
    queryKey: queryKeys.examSets.publishedDetail(examSetId ?? ''),
    queryFn: () => examSetService.getPublishedById(examSetId ?? ''),
    enabled: !!examSetId,
  })

  return (
    <MicPermissionGate>
      <ExamRunner
        examSetId={examSetId ?? ''}
        questions={examSet?.questions ?? []}
        isLoading={isLoading}
        onDone={(sessionId) =>
          sessionId
            ? navigate(`/result/${sessionId}`, { replace: true })
            : navigate('/', { replace: true })
        }
      />
    </MicPermissionGate>
  )
}

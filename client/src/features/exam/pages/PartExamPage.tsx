import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

import { questionService } from '@/features/admin/services/question.service'
import { queryKeys } from '@/lib/query-keys'
import { ExamRunner } from '../components/ExamRunner'
import { MicPermissionGate } from '../components/MicPermissionGate'

export default function PartExamPage() {
  const { partNumber, examSetId } = useParams<{ partNumber: string; examSetId: string }>()
  const navigate = useNavigate()
  const part = Number(partNumber)

  const { data: questions = [], isLoading } = useQuery({
    queryKey: queryKeys.questions.byPartAndSet(part, examSetId ?? ''),
    queryFn: () => questionService.getByPartAndSet(part, examSetId ?? ''),
    enabled: !!part && !!examSetId,
  })

  return (
    <MicPermissionGate>
      <ExamRunner
        examSetId={examSetId ?? ''}
        partNumber={part}
        questions={questions}
        isLoading={isLoading}
        onDone={(sessionId) =>
          sessionId
            ? navigate(`/result/${sessionId}`, { replace: true })
            : navigate('/practice', { replace: true })
        }
      />
    </MicPermissionGate>
  )
}

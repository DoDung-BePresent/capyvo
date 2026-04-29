import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Flex, message } from 'antd'
import { styled } from '@/shared/utils/cn'

import { questionService } from '@/features/admin/services/question.service'
import { responseService } from '@/features/exam/services/response.service'
import { sessionService } from '@/features/exam/services/session.service'
import { queryKeys } from '@/lib/query-keys'
import { QuestionPracticeView } from '../components/QuestionPracticeView'
import { PracticeHistoryPanel } from '../components/PracticeHistoryPanel'
import { MicPermissionGate } from '../components/MicPermissionGate'

const PageContainer = styled('div', 'h-screen flex')
const LeftPanel = styled('div', 'flex-1 p-6 overflow-y-auto')
const RightPanel = styled('div', 'w-96 border-l border-gray-200 p-6 bg-gray-50')

export default function QuestionPracticePage() {
  const { partNumber, questionId } = useParams<{ partNumber: string; questionId: string }>()
  const queryClient = useQueryClient()
  const part = Number(partNumber)

  const [sessionId, setSessionId] = useState<string | null>(null)

  const { data: question, isLoading } = useQuery({
    queryKey: queryKeys.questions.detail(questionId ?? ''),
    queryFn: async () => {
      const questions = await questionService.getByPart(part)
      const q = questions.find((q) => q.id === questionId)
      if (!q) throw new Error('Question not found')
      return { ...q, examSetTitle: q.examSet?.title ?? 'Unknown' }
    },
    enabled: !!questionId && !!part,
  })

  const saveAudioMutation = useMutation({
    mutationFn: async (audioBlob: Blob) => {
      let sid = sessionId
      if (!sid) {
        const { sessionId: newSessionId } = await sessionService.createSession(
          question!.examSetId ?? '',
          part,
        )
        sid = newSessionId
        setSessionId(sid)
      }
      return await responseService.saveAudio(sid, questionId!, audioBlob)
    },
    onSuccess: () => {
      message.success('Đã lưu bài tập')
      queryClient.invalidateQueries({ queryKey: queryKeys.responses.questionHistory(questionId!) })
    },
    onError: () => {
      message.error('Lỗi khi lưu bài tập')
    },
  })

  const handleRecordingComplete = async (audioBlob: Blob) => {
    await saveAudioMutation.mutateAsync(audioBlob)
  }

  if (isLoading || !question) {
    return (
      <PageContainer>
        <Flex align="center" justify="center" style={{ width: '100%' }}>
          Đang tải...
        </Flex>
      </PageContainer>
    )
  }

  return (
    <MicPermissionGate>
      <PageContainer>
        <LeftPanel>
          <QuestionPracticeView
            key={question.id}
            question={question}
            onRecordingComplete={handleRecordingComplete}
            isSubmitting={saveAudioMutation.isPending}
          />
        </LeftPanel>
        <RightPanel>
          <PracticeHistoryPanel questionId={questionId ?? null} />
        </RightPanel>
      </PageContainer>
    </MicPermissionGate>
  )
}

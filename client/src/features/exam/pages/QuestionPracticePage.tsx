import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Flex, message, Spin } from 'antd'
import { styled } from '@/shared/utils/cn'

import { questionService } from '@/features/admin/services/question.service'
import { responseService } from '@/features/exam/services/response.service'
import { sessionService } from '@/features/exam/services/session.service'
import { queryKeys } from '@/lib/query-keys'
import { QuestionPracticeView } from '../components/QuestionPracticeView'
import { PracticeHistoryPanel } from '../components/PracticeHistoryPanel'
import { MicPermissionGate } from '../components/MicPermissionGate'
import { PageHeader } from '@/shared/components'
import { PART_META, type PartNumber } from '@/features/admin/types'

const PageContainer = styled('div', 'flex h-screen')
const LeftPanel = styled('div', 'flex-1 p-6 flex flex-col overflow-hidden')
const LeftContent = styled('div', 'flex-1 overflow-y-auto')
const RightPanel = styled('div', 'w-96 border-l border-gray-200 p-6 bg-gray-50 overflow-y-auto')

export default function QuestionPracticePage() {
  const { partNumber, questionId } = useParams<{ partNumber: string; questionId: string }>()
  const queryClient = useQueryClient()
  const part = Number(partNumber) as PartNumber

  const [sessionId, setSessionId] = useState<string | null>(null)

  const { data: question, isLoading } = useQuery({
    queryKey: queryKeys.questions.detail(questionId ?? ''),
    queryFn: async () => {
      const questions = await questionService.getByPart(part)
      const q = questions.find((q) => q.id === questionId)
      if (!q) throw new Error('Question not found')

      // Get exam set title properly
      const examSetTitle = q.examSet?.title || 'Chưa có bộ đề'

      return { ...q, examSetTitle }
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

  const meta = PART_META[part]

  if (isLoading || !question) {
    return (
      <PageContainer>
        <LeftPanel>
          <PageHeader
            mini
            title={`Luyện ${meta?.label ?? ''}`}
            breadcrumbs={[
              { label: 'Luyện theo Part', href: '/practice' },
              { label: meta?.label ?? '', href: `/practice/part/${part}` },
              { label: 'Luyện tập câu hỏi' },
            ]}
          />
          <LeftContent>
            <Flex align="center" justify="center" style={{ height: '100%' }}>
              <Spin size="large" />
            </Flex>
          </LeftContent>
        </LeftPanel>
        <RightPanel>
          <PracticeHistoryPanel questionId={null} />
        </RightPanel>
      </PageContainer>
    )
  }

  return (
    <MicPermissionGate>
      <PageContainer>
        <LeftPanel>
          <PageHeader
            mini
            title={`Câu ${question.questionNumber} - ${meta?.label ?? ''}`}
            description={question.examSetTitle}
            breadcrumbs={[
              { label: 'Luyện theo Part', href: '/practice' },
              { label: meta?.label ?? '', href: `/practice/part/${part}` },
              { label: `Câu ${question.questionNumber}` },
            ]}
          />
          <LeftContent>
            <QuestionPracticeView
              key={question.id}
              question={question}
              onRecordingComplete={handleRecordingComplete}
              isSubmitting={saveAudioMutation.isPending}
            />
          </LeftContent>
        </LeftPanel>
        <RightPanel>
          <PracticeHistoryPanel questionId={questionId ?? null} />
        </RightPanel>
      </PageContainer>
    </MicPermissionGate>
  )
}

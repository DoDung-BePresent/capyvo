import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Flex, message, Spin } from 'antd'
import { styled } from '@/shared/utils/cn'

import { questionService } from '@/features/admin/services/question.service'
import { responseService } from '@/features/exam/services/response.service'
import { sessionService, type AnalysisResult } from '@/features/exam/services/session.service'
import { queryKeys } from '@/lib/query-keys'
import { PageHeader } from '@/shared/components'
import { MicPermissionGate } from '../components/MicPermissionGate'
import { TestIntroView } from '../components/TestIntroView'
import { PartInstructionView } from '../components/PartInstructionView'
import { FullTestQuestionView } from '../components/FullTestQuestionView'
import { SavingView } from '../components/SavingView'
import { ResultView } from '../components/ResultView'
import { PracticeHistoryPanel } from '../components/PracticeHistoryPanel'
import type { Question, PartNumber } from '@/features/admin/types'
import type { TestState } from '../types/full-test.types'
import { PART_INSTRUCTIONS } from '../types/full-test.types'

const PageContainer = styled('div', 'flex h-screen')
const LeftPanel = styled('div', 'flex-1 p-6 flex flex-col overflow-hidden')
const LeftContent = styled('div', 'flex-1 overflow-y-auto')
const RightPanel = styled('div', 'w-96 border-l border-gray-200 p-6 bg-gray-50 overflow-y-auto')

export default function FullTestPage() {
  const { examSetId } = useParams<{ examSetId: string }>()
  const navigate = useNavigate()

  const [testState, setTestState] = useState<TestState>({
    phase: 'intro',
    currentPartNumber: 1,
    currentQuestionIndex: 0,
    responses: new Map(),
    startTime: null,
    endTime: null,
  })

  const [sessionId, setSessionId] = useState<string | null>(null)
  const [hasAccess, setHasAccess] = useState(true)
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null)
  const [allResults, setAllResults] = useState<
    Array<{ transcript: string; analysis: AnalysisResult; questionId: string }>
  >([])

  // Check subscription on mount
  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const result = await responseService.checkSubscription()
        setHasAccess(result.hasAccess)
        setDaysRemaining(result.daysRemaining)
      } catch (error) {
        console.error('Failed to check subscription:', error)
        setHasAccess(true)
      }
    }
    checkSubscription()
  }, [])

  // Fetch all questions for the exam set
  const { data: examSet, isLoading } = useQuery({
    queryKey: queryKeys.examSets.detail(examSetId ?? ''),
    queryFn: async () => {
      if (!examSetId) throw new Error('Exam set ID is required')
      return questionService.getExamSetById(examSetId)
    },
    enabled: !!examSetId,
  })

  // Group questions by part
  const questionsByPart = examSet?.questions.reduce(
    (acc, q) => {
      const part = q.partNumber
      if (!acc[part]) acc[part] = []
      acc[part].push(q)
      return acc
    },
    {} as Record<number, Question[]>,
  )

  // Get current question
  const getCurrentQuestion = useCallback((): Question | null => {
    if (!questionsByPart) return null
    const partQuestions = questionsByPart[testState.currentPartNumber]
    if (!partQuestions) return null
    return partQuestions[testState.currentQuestionIndex] || null
  }, [questionsByPart, testState.currentPartNumber, testState.currentQuestionIndex])

  const currentQuestion = getCurrentQuestion()

  // Save audio mutation
  const saveAudioMutation = useMutation({
    mutationFn: async (audioBlob: Blob) => {
      let sid = sessionId
      if (!sid) {
        const { sessionId: newSessionId } = await sessionService.createSession(examSetId!, null)
        sid = newSessionId
        setSessionId(sid)
      }
      const result = await responseService.saveAudio(sid, currentQuestion!.id, audioBlob)
      return { responseId: result.responseId, audioUrl: result.audioUrl }
    },
  })

  // Transcribe and analyze mutation
  const analyzeMutation = useMutation({
    mutationFn: async ({ responseId, partNumber }: { responseId: string; partNumber: number }) => {
      return responseService.transcribeAndAnalyze(responseId, partNumber)
    },
  })

  const handleRecordingComplete = async (audioBlob: Blob) => {
    setTestState((prev) => ({ ...prev, phase: 'saving' }))

    try {
      // Save audio
      const { responseId } = await saveAudioMutation.mutateAsync(audioBlob)

      // Store response ID
      setTestState((prev) => {
        const newResponses = new Map(prev.responses)
        newResponses.set(currentQuestion!.id, responseId)
        return { ...prev, responses: newResponses }
      })

      // Transcribe and analyze in background
      const result = await analyzeMutation.mutateAsync({
        responseId,
        partNumber: currentQuestion!.partNumber,
      })

      // Store result for final display
      setAllResults((prev) => [
        ...prev,
        {
          transcript: result.transcript,
          analysis: result.analysis as AnalysisResult,
          questionId: currentQuestion!.id,
        },
      ])

      // Move to next question or complete
      moveToNext()
    } catch (error) {
      console.error('Failed to save/analyze:', error)
      message.error('Lỗi khi lưu bài tập. Vui lòng thử lại.')
      // Go back to preparing phase to retry
      setTestState((prev) => ({ ...prev, phase: 'preparing' }))
    }
  }

  const moveToNext = () => {
    const partQuestions = questionsByPart?.[testState.currentPartNumber] || []
    const isLastQuestionInPart = testState.currentQuestionIndex >= partQuestions.length - 1

    if (isLastQuestionInPart) {
      // Move to next part
      if (testState.currentPartNumber < 5) {
        setTestState((prev) => ({
          ...prev,
          phase: 'part-instruction',
          currentPartNumber: prev.currentPartNumber + 1,
          currentQuestionIndex: 0,
        }))
      } else {
        // Test completed
        setTestState((prev) => ({
          ...prev,
          phase: 'completed',
          endTime: new Date(),
        }))
      }
    } else {
      // Move to next question in same part
      setTestState((prev) => ({
        ...prev,
        phase: 'preparing',
        currentQuestionIndex: prev.currentQuestionIndex + 1,
      }))
    }
  }

  const handleStartTest = () => {
    if (!hasAccess) return
    setTestState((prev) => ({
      ...prev,
      phase: 'part-instruction',
      startTime: new Date(),
    }))
  }

  const handleContinueFromInstruction = () => {
    setTestState((prev) => ({ ...prev, phase: 'preparing' }))
  }

  const handleCancelTest = () => {
    // Navigate back to exam list without saving
    navigate('/exam')
  }

  const showHistoryPanel = testState.phase === 'intro' || testState.phase === 'completed'

  if (isLoading || !examSet) {
    return (
      <PageContainer>
        <LeftPanel>
          <PageHeader mini title="Thi thử Full Test" breadcrumbs={[{ label: 'Đang tải...' }]} />
          <LeftContent>
            <Flex align="center" justify="center" style={{ height: '100%' }}>
              <Spin size="large" />
            </Flex>
          </LeftContent>
        </LeftPanel>
      </PageContainer>
    )
  }

  return (
    <MicPermissionGate>
      <PageContainer>
        <LeftPanel>
          <PageHeader
            mini
            title={examSet.title}
            description="Thi thử Full Test - 11 câu hỏi"
            breadcrumbs={[{ label: 'Thi thử', href: '/exam' }, { label: examSet.title }]}
          />
          <LeftContent>
            {testState.phase === 'intro' && (
              <TestIntroView
                onStart={handleStartTest}
                hasAccess={hasAccess}
                daysRemaining={daysRemaining}
              />
            )}

            {testState.phase === 'part-instruction' && (
              <PartInstructionView
                instruction={PART_INSTRUCTIONS[testState.currentPartNumber]}
                onContinue={handleContinueFromInstruction}
                onCancel={handleCancelTest}
              />
            )}

            {(testState.phase === 'preparing' || testState.phase === 'recording') &&
              currentQuestion && (
                <FullTestQuestionView
                  question={currentQuestion}
                  onRecordingComplete={handleRecordingComplete}
                  onCancel={handleCancelTest}
                />
              )}

            {testState.phase === 'saving' && <SavingView />}

            {testState.phase === 'completed' && (
              <div>
                <h2>Hoàn thành bài thi!</h2>
                {/* TODO: Show all results */}
                {allResults.map((result, index) => (
                  <ResultView
                    key={index}
                    partNumber={1 as PartNumber}
                    transcript={result.transcript}
                    analysis={result.analysis}
                  />
                ))}
              </div>
            )}
          </LeftContent>
        </LeftPanel>

        {showHistoryPanel && (
          <RightPanel>
            <PracticeHistoryPanel questionId={null} />
          </RightPanel>
        )}
      </PageContainer>
    </MicPermissionGate>
  )
}

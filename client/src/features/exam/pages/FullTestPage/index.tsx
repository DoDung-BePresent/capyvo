/**
 * Hooks
 */
import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'

/**
 * Utils
 */
import { styled } from '@/shared/utils/cn'

/**
 * Services
 */
import { questionService } from '@/features/admin/services/question.service'
import { responseService } from '@/features/exam/services/response.service'
import { sessionService, type AnalysisResult } from '@/features/exam/services/session.service'

/**
 * QUERY_KEYS
 */
import { queryKeys } from '@/lib/query-keys'

/**
 * Subscription hooks
 */
import { useCurrentSubscription } from '@/features/auth/hooks/useSubscription'

/**
 * Components
 */
import { PageHeader } from '@/shared/components'
import { Flex, message, Spin, Card, Typography, Tag, Progress, Modal } from 'antd'
import { CrownOutlined } from '@ant-design/icons'
import { MicPermissionGate } from '@/features/exam/components/MicPermissionGate'
import { TestIntroView } from './components/TestIntroView'
import { PartInstructionView } from './components/PartInstructionView'
import { FullTestQuestionView } from './components/FullTestQuestionView'
import { SavingView } from './components/SavingView'
import { FullTestHistoryPanel } from './components/FullTestHistoryPanel'
import { ResultView } from '../../components/ResultView'

/**
 * Types
 */
import type { Question } from '@/shared/types/domain'
import type { TestState } from '@/features/exam/types/full-test.types'
import { PART_INSTRUCTIONS } from '@/features/exam/types/full-test.types'

const { Title, Text, Paragraph } = Typography

const PageContainer = styled('div', 'flex h-screen')
const LeftPanel = styled('div', 'flex-1 p-6 flex flex-col overflow-hidden')
const LeftContent = styled('div', 'flex-1 overflow-y-auto')
const RightPanel = styled('div', 'w-96 border-l border-gray-200 p-6 bg-gray-50 overflow-y-auto')

const PART_NAMES: Record<number, string> = {
  1: 'Part 1: Read a text aloud',
  2: 'Part 2: Describe a picture',
  3: 'Part 3: Respond to questions',
  4: 'Part 4: Respond using information',
  5: 'Part 5: Express an opinion',
}

export default function FullTestPage() {
  const { examSetId } = useParams<{ examSetId: string }>()
  const navigate = useNavigate()
  const { data: subscriptionData, isLoading: isLoadingSubscription } = useCurrentSubscription()
  const isPremium = subscriptionData?.isPremium ?? false

  const [testState, setTestState] = useState<TestState>({
    phase: 'intro',
    currentPartNumber: 1,
    currentQuestionIndex: 0,
    responses: new Map(),
    startTime: null,
    endTime: null,
  })

  const [sessionId, setSessionId] = useState<string | null>(null)
  const [allResults, setAllResults] = useState<
    Array<{ transcript: string; analysis: AnalysisResult | null; questionId: string }>
  >([])
  const [contextPlayedForPart, setContextPlayedForPart] = useState<Record<number, boolean>>({})
  const [selectedHistorySessionId, setSelectedHistorySessionId] = useState<string | null>(null)
  const [pendingResponses, setPendingResponses] = useState<Set<string>>(new Set())

  // Check if user is premium - block FREE users (only after subscription data is loaded)
  useEffect(() => {
    // Don't check until subscription data is loaded
    if (isLoadingSubscription) return

    if (!isPremium) {
      Modal.warning({
        title: (
          <div className="flex items-center space-x-2">
            <CrownOutlined className="text-yellow-500" />
            <span>Tính năng Premium</span>
          </div>
        ),
        content: (
          <div className="space-y-2">
            <p>Luyện full đề chỉ dành cho người dùng Premium.</p>
            <p className="text-sm text-gray-600">Nâng cấp ngay để trải nghiệm đầy đủ tính năng:</p>
            <ul className="list-inside list-disc space-y-1 text-sm text-gray-600">
              <li>Luyện full đề không giới hạn</li>
              <li>AI chấm điểm phát âm và nội dung</li>
              <li>Phân tích chi tiết từng câu trả lời</li>
              <li>Lưu lịch sử luyện tập</li>
            </ul>
          </div>
        ),
        okText: 'Nâng cấp ngay',
        onOk: () => navigate('/pricing'),
        centered: true,
      })
      // Redirect after showing modal
      setTimeout(() => navigate('/exam'), 500)
    }
  }, [isPremium, isLoadingSubscription, navigate])

  // Load selected session detail when clicking history
  const { data: selectedSession, isLoading: isLoadingSession } = useQuery({
    queryKey: queryKeys.practiceSessions.detail(selectedHistorySessionId ?? ''),
    queryFn: () => sessionService.getSessionDetail(selectedHistorySessionId!),
    enabled: !!selectedHistorySessionId,
  })

  const { data: selectedAssessment, isLoading: isLoadingAssessment } = useQuery({
    queryKey: ['overallAssessment', selectedHistorySessionId],
    queryFn: () => responseService.getOverallAssessment(selectedHistorySessionId!),
    enabled: !!selectedHistorySessionId,
  })

  const handleSelectHistorySession = (historySessionId: string) => {
    setSelectedHistorySessionId(historySessionId)
  }

  // Poll for queued results when test is completed
  useEffect(() => {
    if (testState.phase !== 'completed' || pendingResponses.size === 0) return

    const pollInterval = setInterval(async () => {
      const responseIds = Array.from(pendingResponses)

      for (const responseId of responseIds) {
        try {
          const result = await responseService.getQueuedResult(responseId)

          if (result.status === 'completed') {
            // Update allResults with completed result
            setAllResults((prev) =>
              prev.map((r) => {
                // Find by matching responseId in testState.responses
                const questionId = Array.from(testState.responses.entries()).find(
                  ([_, rid]) => rid === responseId,
                )?.[0]

                if (r.questionId === questionId) {
                  return {
                    ...r,
                    transcript: result.transcript,
                    analysis: result.analysis,
                  }
                }
                return r
              }),
            )

            // Remove from pending
            setPendingResponses((prev) => {
              const next = new Set(prev)
              next.delete(responseId)
              return next
            })
          }
        } catch (error) {
          console.error('Failed to fetch queued result:', error)
        }
      }
    }, 3000) // Poll every 3 seconds

    return () => clearInterval(pollInterval)
  }, [testState.phase, testState.responses, pendingResponses])

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

  // Transcribe and analyze mutation (PREMIUM only) - USE QUEUE for full test
  const analyzeMutation = useMutation({
    mutationFn: async ({ responseId, partNumber }: { responseId: string; partNumber: number }) => {
      if (isPremium) {
        // Full test mode: Try to use queue (async), fallback to sync if queue unavailable
        const result = await responseService.transcribeAndAnalyze(responseId, partNumber, true)
        if ('jobId' in result) {
          // Job queued successfully
          return { transcript: '', analysis: null, queued: true }
        }
        // Fallback to sync (queue unavailable)
        return { ...result, queued: false }
      } else {
        // FREE: transcribe only
        const transcript = await responseService.transcribe(responseId)
        return { transcript, analysis: null, queued: false }
      }
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

      // Store result for final display (even if queued, we'll fetch later)
      if (!('queued' in result) || !result.queued) {
        setAllResults((prev) => [
          ...prev,
          {
            transcript: result.transcript,
            analysis: result.analysis,
            questionId: currentQuestion!.id,
          },
        ])
      } else {
        // Queued - store placeholder and track for polling
        setAllResults((prev) => [
          ...prev,
          {
            transcript: '',
            analysis: null,
            questionId: currentQuestion!.id,
          },
        ])
        setPendingResponses((prev) => new Set(prev).add(responseId))
      }

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
        // Test completed - complete session and get overall assessment
        if (sessionId) {
          sessionService
            .completeSession(sessionId)
            .then(() => responseService.getOverallAssessment(sessionId))
            .then((assessment) => {
              setTestState((prev) => ({
                ...prev,
                phase: 'completed',
                endTime: new Date(),
                overallAssessment: assessment,
              }))
            })
            .catch((error) => {
              console.error('Failed to complete session:', error)
              setTestState((prev) => ({
                ...prev,
                phase: 'completed',
                endTime: new Date(),
              }))
            })
        } else {
          setTestState((prev) => ({
            ...prev,
            phase: 'completed',
            endTime: new Date(),
          }))
        }
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
    window.location.href = '/exam'
  }

  const getScoreColor = (score: number) => {
    if (score >= 160) return '#52c41a'
    if (score >= 120) return '#1890ff'
    if (score >= 80) return '#faad14'
    return '#ff4d4f'
  }

  const getScoreLevel = (score: number) => {
    if (score >= 160) return 'Excellent'
    if (score >= 120) return 'Good'
    if (score >= 80) return 'Fair'
    return 'Limited'
  }

  const showHistoryPanel = testState.phase === 'intro' || testState.phase === 'completed'

  if (isLoading || !examSet) {
    return (
      <PageContainer>
        <LeftPanel>
          <PageHeader mini title="Thi thử Full Test" />
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
            {/* Show loading when fetching history */}
            {selectedHistorySessionId && (isLoadingSession || isLoadingAssessment) && (
              <Flex justify="center" align="center" style={{ minHeight: '60vh' }}>
                <Spin size="large" />
              </Flex>
            )}

            {/* Show history result if selected */}
            {selectedHistorySessionId && selectedAssessment && selectedSession && (
              <Flex vertical gap={24}>
                {/* Top Section: Horizontal layout */}
                <Card>
                  <Flex gap={24} align="stretch">
                    {/* Left: Score Circle */}
                    <Flex vertical align="center" gap={12} style={{ marginLeft: 5 }}>
                      <div
                        style={{
                          width: 200,
                          height: 200,
                          borderRadius: '50%',
                          backgroundColor: getScoreColor(selectedAssessment.estimatedScore),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexDirection: 'column',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        }}
                      >
                        <div
                          style={{
                            fontSize: 48,
                            fontWeight: 700,
                            color: '#fff',
                            lineHeight: 1,
                          }}
                        >
                          {selectedAssessment.estimatedScore}
                        </div>
                        <div
                          style={{
                            fontSize: 16,
                            color: '#fff',
                            marginTop: 8,
                            opacity: 0.9,
                          }}
                        >
                          / 200 điểm
                        </div>
                      </div>
                      <Tag
                        color={getScoreColor(selectedAssessment.estimatedScore)}
                        style={{ fontSize: 14, padding: '4px 16px' }}
                      >
                        {getScoreLevel(selectedAssessment.estimatedScore)}
                      </Tag>
                    </Flex>

                    {/* Right: Assessment */}
                    <div>
                      <Title level={5} style={{ marginBottom: 16 }}>
                        Nhận xét chung
                      </Title>
                      <Paragraph style={{ fontSize: 14, lineHeight: 1.8, color: '#595959' }}>
                        {selectedAssessment.assessment}
                      </Paragraph>
                    </div>
                  </Flex>
                </Card>

                {/* Bottom Section: Detailed Results */}
                {selectedSession.userResponses.map((response) => {
                  const question = examSet?.questions.find((q) => q.id === response.questionId)
                  if (!question) return null

                  return (
                    <div key={response.id}>
                      <Title level={5} style={{ marginBottom: 12 }}>
                        {PART_NAMES[question.partNumber]} - Câu {question.questionNumber}
                      </Title>
                      <ResultView
                        partNumber={question.partNumber as 1 | 2 | 3 | 4 | 5}
                        transcript={response.transcript || undefined}
                        analysis={response.pronunciationScore || undefined}
                        referenceText={question.contentText || undefined}
                        audioUrl={response.audioUrl || undefined}
                        isLoading={false}
                        isPremium={isPremium}
                        onReset={() => setSelectedHistorySessionId(null)}
                      />
                    </div>
                  )
                })}
              </Flex>
            )}

            {!selectedHistorySessionId && testState.phase === 'intro' && (
              <TestIntroView onStart={handleStartTest} />
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
                  skipContextAudio={contextPlayedForPart[testState.currentPartNumber] || false}
                  onContextPlayed={() => {
                    setContextPlayedForPart((prev) => ({
                      ...prev,
                      [testState.currentPartNumber]: true,
                    }))
                  }}
                />
              )}

            {testState.phase === 'saving' && <SavingView />}

            {testState.phase === 'completed' &&
              !selectedHistorySessionId &&
              testState.overallAssessment && (
                <Flex vertical gap={24}>
                  {/* Top Section: Horizontal layout */}
                  <Card>
                    <Flex gap={24} align="stretch">
                      {/* Left: Score Circle */}
                      <Flex vertical align="center" gap={12} style={{ marginLeft: 5 }}>
                        <div
                          style={{
                            width: 200,
                            height: 200,
                            borderRadius: '50%',
                            backgroundColor: getScoreColor(
                              testState.overallAssessment.estimatedScore,
                            ),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'column',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          }}
                        >
                          <div
                            style={{
                              fontSize: 48,
                              fontWeight: 700,
                              color: '#fff',
                              lineHeight: 1,
                            }}
                          >
                            {testState.overallAssessment.estimatedScore}
                          </div>
                          <div
                            style={{
                              fontSize: 16,
                              color: '#fff',
                              marginTop: 8,
                              opacity: 0.9,
                            }}
                          >
                            / 200 điểm
                          </div>
                        </div>
                        <Tag
                          color={getScoreColor(testState.overallAssessment.estimatedScore)}
                          style={{ fontSize: 14, padding: '4px 16px' }}
                        >
                          {getScoreLevel(testState.overallAssessment.estimatedScore)}
                        </Tag>
                      </Flex>

                      {/* Middle: Part Scores */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Title level={5} style={{ marginBottom: 16 }}>
                          Điểm theo từng phần
                        </Title>
                        <Flex vertical gap={16}>
                          {Object.entries(testState.overallAssessment.partScores).map(
                            ([part, score]) => (
                              <div key={part}>
                                <Flex
                                  justify="space-between"
                                  align="center"
                                  style={{ marginBottom: 8 }}
                                >
                                  <Text strong>{PART_NAMES[Number(part)]}</Text>
                                  <Text
                                    strong
                                    style={{ color: getScoreColor((score as number) * 2) }}
                                  >
                                    {(score as number).toFixed(1)}/100
                                  </Text>
                                </Flex>
                                <Progress
                                  percent={score as number}
                                  strokeColor={getScoreColor((score as number) * 2)}
                                  showInfo={false}
                                />
                              </div>
                            ),
                          )}
                        </Flex>
                      </div>

                      {/* Right: Assessment */}
                      <div style={{ width: 300, flexShrink: 0 }}>
                        <Title level={5} style={{ marginBottom: 16 }}>
                          Nhận xét chung
                        </Title>
                        <Paragraph style={{ fontSize: 14, lineHeight: 1.8, color: '#595959' }}>
                          {testState.overallAssessment.assessment}
                        </Paragraph>
                      </div>
                    </Flex>
                  </Card>

                  {/* Bottom Section: Detailed Results */}
                  {allResults.map((result) => {
                    const question = examSet?.questions.find((q) => q.id === result.questionId)
                    if (!question) return null

                    return (
                      <div key={result.questionId}>
                        <Title level={5} style={{ marginBottom: 12 }}>
                          {PART_NAMES[question.partNumber]} - Câu {question.questionNumber}
                        </Title>
                        <ResultView
                          partNumber={question.partNumber as 1 | 2 | 3 | 4 | 5}
                          transcript={result.transcript}
                          analysis={result.analysis || undefined}
                          referenceText={question.contentText || undefined}
                          audioUrl={undefined}
                          isLoading={false}
                          isPremium={isPremium}
                          hideActions={true}
                          onReset={() => {
                            // No action needed - user is viewing completed test results
                          }}
                        />
                      </div>
                    )
                  })}
                </Flex>
              )}

            {testState.phase === 'completed' &&
              !selectedAssessment &&
              !testState.overallAssessment && (
                <Flex justify="center" align="center" style={{ minHeight: '60vh' }}>
                  <Spin size="large" />
                </Flex>
              )}
          </LeftContent>
        </LeftPanel>

        {showHistoryPanel && examSetId && (
          <RightPanel>
            <FullTestHistoryPanel
              examSetId={examSetId}
              currentSessionId={sessionId}
              onSelectSession={handleSelectHistorySession}
            />
          </RightPanel>
        )}
      </PageContainer>
    </MicPermissionGate>
  )
}

/**
 * Hooks
 */
import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Components
 */
import { Card, Typography, Tag, Flex, Space, Progress, Tooltip, message } from 'antd'

/**
 * Icons
 */
import { Mic, Stop, Cancel, VolumeUp } from '@mui/icons-material'

/**
 * Utils
 */
import { styled } from '@/shared/utils/cn'
import { hexToRgba } from '@/shared/utils/color'

/**
 * Components
 */
import { StyledButton } from '@/shared/components'

/**
 * Hooks
 */
import { useMicPermission } from '@/features/exam/hooks/useMicPermission'
import { useTranscribeAndAnalyze } from '@/features/exam/hooks/useTranscribeAndAnalyze'
import { useTranscribe } from '@/features/exam/hooks/useTranscribe'
import { useIsPremium } from '@/features/auth/hooks/useSubscription'
import { MicWaveform } from '@/features/exam/components/MicWaveform'
import { BasicResultView } from './BasicResultView'
import { PremiumResultView } from './PremiumResultView'

/**
 * Types
 */
import type { Question, PartNumber } from '@/shared/types/domain'
import type { AnalysisResult } from '@/features/exam/services/session.service'

/**
 * Constants
 */
import { COLORS } from '@/shared/constants/user-color'
import { getErrorMessage } from '@/shared/constants/error-messages'

/**
 * Assets
 */
import buttonRecordSound from '@/assets/sounds/button-record-sound.mp3'

const { Title, Text, Paragraph } = Typography

const Container = styled('div', 'h-full flex gap-4 flex-col')
const QuestionCard = styled(Card, 'flex-1 rounded-lg! mb-4 overflow-y-auto')
const ControlPanel = styled(Card, 'mt-auto rounded-lg!')
const AudioIcon = styled(
  'button',
  'inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors cursor-pointer border-0',
)

interface QuestionPracticeViewProps {
  question: Question & { examSetTitle: string }
  onRecordingComplete: (audioBlob: Blob) => Promise<{ responseId: string; audioUrl: string }>
  onAnalysisComplete?: () => void
  isSubmitting?: boolean
}

type RecordingState = 'idle' | 'preparing' | 'recording' | 'completed' | 'analyzing' | 'result'

export function QuestionPracticeView({
  question,
  onRecordingComplete,
  onAnalysisComplete,
  isSubmitting = false,
}: QuestionPracticeViewProps) {
  const { hasPermission, requestPermission } = useMicPermission()
  const isPremium = useIsPremium()

  const [recordingState, setRecordingState] = useState<RecordingState>('idle')
  const [prepTimeLeft, setPrepTimeLeft] = useState(question.prepTimeSeconds)
  const [recordTimeLeft, setRecordTimeLeft] = useState(question.responseTimeSeconds)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [recordingStream, setRecordingStream] = useState<MediaStream | null>(null)
  const [analysisResult, setAnalysisResult] = useState<{
    transcript: string
    analysis: AnalysisResult
    audioUrl?: string
    responseId?: string
  } | null>(null)
  const [isCancelled, setIsCancelled] = useState(false)

  const contextAudioRef = useRef<HTMLAudioElement>(null!)
  const questionAudioRef = useRef<HTMLAudioElement>(null!)
  const startSoundRef = useRef<HTMLAudioElement>(null!)

  const { mutate: transcribeAndAnalyze, isPending: isAnalyzing } = useTranscribeAndAnalyze({
    onSuccess: (data) => {
      console.log('✅ Analysis complete:', data)
      setAnalysisResult({
        ...data,
        audioUrl: analysisResult?.audioUrl,
      })
      setRecordingState('result')
      onAnalysisComplete?.()
    },
    onError: (error: unknown) => {
      console.error('❌ Analysis error:', error)
      const err = error as { response?: { data?: { error?: string; message?: string } } }
      const errorCode = err.response?.data?.error
      message.error(getErrorMessage(errorCode))
      setRecordingState('completed')
    },
  })

  // For BASIC users: transcribe only
  const { mutate: transcribeOnly, isPending: isTranscribing } = useTranscribe('temp-session-id', {
    onSuccess: (transcript) => {
      console.log('✅ Transcription complete:', transcript)
      setAnalysisResult({
        transcript,
        analysis: {} as AnalysisResult,
        audioUrl: analysisResult?.audioUrl,
      })
      setRecordingState('result')
      onAnalysisComplete?.()
    },
    onError: (error: unknown) => {
      console.error('❌ Transcription error:', error)
      const err = error as { response?: { data?: { error?: string; message?: string } } }
      const errorCode = err.response?.data?.error
      message.error(getErrorMessage(errorCode))
      setRecordingState('completed')
    },
  })

  // Auto-play audio sequence when question loads
  useEffect(() => {
    const playAudioSequence = async () => {
      try {
        // Play context audio first (if exists)
        if (question.contextAudioUrl && contextAudioRef.current) {
          await contextAudioRef.current.play()
          await new Promise<void>((resolve) => {
            if (contextAudioRef.current) {
              contextAudioRef.current.onended = () => resolve()
            }
          })
        }

        // Then play question audio (if exists)
        if (question.questionAudioUrl && questionAudioRef.current) {
          await questionAudioRef.current.play()
        }
      } catch (error) {
        console.log('Auto-play blocked or failed:', error)
      }
    }

    playAudioSequence()
  }, [question.id, question.contextAudioUrl, question.questionAudioUrl])

  // Cleanup function
  const stopRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
    }
    if (recordingStream) {
      recordingStream.getTracks().forEach((track) => track.stop())
      setRecordingStream(null)
    }
  }, [mediaRecorder, recordingStream])

  // Start recording function
  const startRecording = useCallback(async () => {
    try {
      setIsCancelled(false) // Reset cancel flag
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      setRecordingStream(stream)

      const recorder = new MediaRecorder(stream)
      const chunks: Blob[] = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data)
        }
      }

      recorder.onstop = async () => {
        console.log('🎤 Recording stopped')

        // Check if cancelled - don't process if cancelled
        if (isCancelled) {
          console.log('❌ Recording was cancelled, not processing')
          return
        }

        const blob = new Blob(chunks, { type: 'audio/webm' })
        console.log('📦 Audio blob created:', blob.size, 'bytes')
        stream.getTracks().forEach((track) => track.stop())
        setRecordingStream(null)

        // Save audio and get response ID
        setRecordingState('analyzing')
        console.log('💾 Saving audio...')
        try {
          const result = await onRecordingComplete(blob)
          console.log('✅ Audio saved, responseId:', result.responseId)
          // Store audioUrl and responseId for later use
          setAnalysisResult({
            transcript: '',
            analysis: {} as AnalysisResult,
            audioUrl: result.audioUrl,
            responseId: result.responseId,
          })

          // Check user plan and call appropriate API
          if (isPremium) {
            // PREMIUM: Full analysis
            console.log('🔄 Starting transcribe & analyze (PREMIUM)...')
            transcribeAndAnalyze({ responseId: result.responseId, partNumber: question.partNumber })
          } else {
            // FREE: Transcribe only
            console.log('🔄 Starting transcribe only (FREE)...')
            transcribeOnly(result.responseId)
          }
        } catch (error) {
          console.error('❌ Failed to save audio:', error)
          setRecordingState('completed')
        }
      }

      recorder.start()
      setMediaRecorder(recorder)
      setRecordingState('recording')
    } catch (error) {
      console.error('Failed to start recording:', error)
      setRecordingState('idle')
    }
  }, [
    onRecordingComplete,
    transcribeAndAnalyze,
    transcribeOnly,
    question.partNumber,
    isCancelled,
    isPremium,
  ])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording()
    }
  }, [stopRecording])

  // Prep timer
  useEffect(() => {
    if (recordingState !== 'preparing') return
    if (prepTimeLeft <= 0) {
      const timer = setTimeout(() => {
        startRecording()
      }, 0)
      return () => clearTimeout(timer)
    }

    const timer = setInterval(() => {
      setPrepTimeLeft((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [recordingState, prepTimeLeft, startRecording])

  // Record timer
  useEffect(() => {
    if (recordingState !== 'recording') return
    if (recordTimeLeft <= 0) {
      const timer = setTimeout(() => {
        stopRecording()
      }, 0)
      return () => clearTimeout(timer)
    }

    const timer = setInterval(() => {
      setRecordTimeLeft((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [recordingState, recordTimeLeft, stopRecording])

  const startPreparing = async () => {
    if (!hasPermission) {
      await requestPermission()
      return
    }

    // Play start sound
    if (startSoundRef.current) {
      startSoundRef.current.currentTime = 0
      startSoundRef.current.play().catch((error) => console.log('Sound play failed:', error))
    }

    setPrepTimeLeft(question.prepTimeSeconds)
    setRecordTimeLeft(question.responseTimeSeconds)
    setRecordingState('preparing')
  }

  const skipPreparation = () => {
    startRecording()
  }

  const handleCancel = () => {
    setIsCancelled(true) // Set cancel flag before stopping
    stopRecording()
    setRecordingState('idle')
    setPrepTimeLeft(question.prepTimeSeconds)
    setRecordTimeLeft(question.responseTimeSeconds)
  }

  const handleReset = () => {
    setRecordingState('idle')
    setPrepTimeLeft(question.prepTimeSeconds)
    setRecordTimeLeft(question.responseTimeSeconds)
    setAnalysisResult(null)
  }

  const getReferenceText = () => {
    return question.contentText || question.questionText || undefined
  }

  const playAudio = (audioRef: React.RefObject<HTMLAudioElement>) => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch((error) => console.log('Play failed:', error))
    }
  }

  const prepProgress = ((question.prepTimeSeconds - prepTimeLeft) / question.prepTimeSeconds) * 100
  const recordProgress =
    ((question.responseTimeSeconds - recordTimeLeft) / question.responseTimeSeconds) * 100

  return (
    <Container>
      {/* Hidden audio elements for auto-play */}
      {question.contextAudioUrl && (
        <audio ref={contextAudioRef} src={question.contextAudioUrl} preload="auto" />
      )}
      {question.questionAudioUrl && (
        <audio ref={questionAudioRef} src={question.questionAudioUrl} preload="auto" />
      )}
      {/* Start sound */}
      <audio ref={startSoundRef} src={buttonRecordSound} preload="auto" />

      {/* Show Result View when analyzing or analysis is complete */}
      {(recordingState === 'analyzing' ||
        recordingState === 'result' ||
        recordingState === 'completed') && (
        <>
          {isPremium ? (
            <PremiumResultView
              partNumber={question.partNumber as PartNumber}
              transcript={analysisResult?.transcript}
              analysis={analysisResult?.analysis}
              referenceText={getReferenceText()}
              audioUrl={analysisResult?.audioUrl}
              isLoading={isAnalyzing || isTranscribing || recordingState === 'completed'}
              onReset={handleReset}
            />
          ) : (
            <BasicResultView
              partNumber={question.partNumber as PartNumber}
              transcript={analysisResult?.transcript}
              referenceText={getReferenceText()}
              audioUrl={analysisResult?.audioUrl}
              isLoading={isTranscribing || recordingState === 'completed'}
              onReset={handleReset}
            />
          )}
        </>
      )}

      {/* Show Question Content when not in analyzing/result/completed state */}
      {recordingState !== 'analyzing' &&
        recordingState !== 'result' &&
        recordingState !== 'completed' && (
          <>
            <QuestionCard>
              <Flex vertical gap={16}>
                {/* Header */}
                <Flex align="center" justify="space-between">
                  <Space>
                    <Tag color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>
                      Câu {question.questionNumber}
                    </Tag>
                    <Text type="secondary">{question.examSetTitle}</Text>
                  </Space>
                  <Space>
                    <Tag>{question.prepTimeSeconds}s chuẩn bị</Tag>
                    <Tag>{question.responseTimeSeconds}s trả lời</Tag>
                  </Space>
                </Flex>

                {/* Images */}
                {question.imageUrls && question.imageUrls.length > 0 && (
                  <div>
                    <Title level={5} style={{ marginBottom: 12 }}>
                      Hình ảnh
                    </Title>
                    <Flex gap={12} justify="center" wrap="wrap">
                      {question.imageUrls.map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt={`Question ${question.questionNumber}`}
                          style={{
                            maxWidth: '100%',
                            maxHeight: 400,
                            borderRadius: 8,
                            objectFit: 'contain',
                          }}
                        />
                      ))}
                    </Flex>
                  </div>
                )}

                {/* Context Text (Part 3, 4, 5) */}
                {question.contextText && (
                  <div>
                    <Flex align="center" gap={8} style={{ marginBottom: 12 }}>
                      <Title level={5} style={{ margin: 0 }}>
                        Ngữ cảnh
                      </Title>
                      {question.contextAudioUrl && (
                        <Tooltip title="Phát audio ngữ cảnh">
                          <AudioIcon onClick={() => playAudio(contextAudioRef)}>
                            <VolumeUp style={{ fontSize: 18, color: '#1890ff' }} />
                          </AudioIcon>
                        </Tooltip>
                      )}
                    </Flex>
                    <Paragraph
                      style={{
                        fontSize: 15,
                        lineHeight: 1.8,
                        backgroundColor: '#f5f5f5',
                        padding: 16,
                        borderRadius: 8,
                      }}
                    >
                      {question.contextText}
                    </Paragraph>
                  </div>
                )}

                {/* Question Text */}
                {(question.contentText || question.questionText) && (
                  <div>
                    <Flex align="center" gap={8} style={{ marginBottom: 12 }}>
                      <Title level={5} style={{ margin: 0 }}>
                        Câu hỏi
                      </Title>
                      {question.questionAudioUrl && (
                        <Tooltip title="Phát audio câu hỏi">
                          <AudioIcon onClick={() => playAudio(questionAudioRef)}>
                            <VolumeUp style={{ fontSize: 18, color: '#1890ff' }} />
                          </AudioIcon>
                        </Tooltip>
                      )}
                    </Flex>
                    <Paragraph style={{ fontSize: 16, lineHeight: 1.8 }}>
                      {question.contentText || question.questionText}
                    </Paragraph>
                  </div>
                )}
              </Flex>
            </QuestionCard>

            {/* Control Panel */}
            <ControlPanel>
              <Flex align="center" justify="space-between" gap={16}>
                {/* Left: Circular countdown (only for prep/record states) */}
                <div style={{ width: 80, flexShrink: 0 }}>
                  {recordingState === 'preparing' && (
                    <Flex vertical align="center" gap={4}>
                      <Progress
                        type="circle"
                        percent={prepProgress}
                        format={() => `${prepTimeLeft}s`}
                        strokeColor="#1890ff"
                        strokeWidth={10}
                        size={80}
                      />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Chuẩn bị
                      </Text>
                    </Flex>
                  )}
                  {recordingState === 'recording' && (
                    <Flex vertical align="center" gap={4}>
                      <Progress
                        type="circle"
                        percent={recordProgress}
                        format={() => `${recordTimeLeft}s`}
                        strokeColor="#ff4d4f"
                        strokeWidth={10}
                        size={80}
                      />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Ghi âm
                      </Text>
                    </Flex>
                  )}
                  {recordingState === 'idle' && <div style={{ width: 80, height: 80 }} />}
                </div>

                {/* Center: Waveform */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {recordingState === 'recording' && recordingStream && (
                    <Flex align="center" justify="center" style={{ height: 80 }}>
                      <MicWaveform color={COLORS.primary} stream={recordingStream} height={80} />
                    </Flex>
                  )}
                  {recordingState === 'preparing' && (
                    <Flex align="center" justify="center" style={{ height: 80 }}>
                      <Text type="secondary">Đang chuẩn bị...</Text>
                    </Flex>
                  )}
                  {recordingState === 'idle' && (
                    <Flex align="center" justify="center" style={{ height: 80 }}>
                      <Text type="secondary">Nhấn nút để bắt đầu</Text>
                    </Flex>
                  )}
                </div>

                {/* Right: Action buttons */}
                <Flex gap={12} style={{ flexShrink: 0 }}>
                  {recordingState === 'idle' && (
                    <StyledButton
                      size="large"
                      type="primary"
                      icon={<Mic style={{ fontSize: 20 }} />}
                      onClick={startPreparing}
                      disabled={isSubmitting}
                      style={{
                        width: '100%',
                        backgroundColor: COLORS.primary,
                        borderColor: COLORS.primary,
                      }}
                    >
                      Bắt đầu luyện tập
                    </StyledButton>
                  )}

                  {(recordingState === 'preparing' || recordingState === 'recording') && (
                    <>
                      <StyledButton
                        size="large"
                        danger
                        icon={<Cancel style={{ fontSize: 20 }} />}
                        onClick={handleCancel}
                      >
                        Hủy
                      </StyledButton>
                      {recordingState === 'preparing' && (
                        <StyledButton
                          size="large"
                          type="primary"
                          onClick={skipPreparation}
                          shadowColor={hexToRgba(COLORS.secondary, 0.6)}
                          style={{
                            width: '100%',
                            backgroundColor: COLORS.secondary,
                            borderColor: COLORS.secondary,
                          }}
                        >
                          Bỏ qua
                        </StyledButton>
                      )}
                      {recordingState === 'recording' && (
                        <StyledButton
                          size="large"
                          color="danger"
                          variant="solid"
                          icon={<Stop style={{ fontSize: 20 }} />}
                          shadowColor={hexToRgba(COLORS.accent, 0.4)}
                          onClick={stopRecording}
                        >
                          Dừng và gửi
                        </StyledButton>
                      )}
                    </>
                  )}
                </Flex>
              </Flex>
            </ControlPanel>
          </>
        )}
    </Container>
  )
}

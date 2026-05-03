import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, Typography, Tag, Flex, Space, Progress, Tooltip, message } from 'antd'
import { VolumeUp } from '@mui/icons-material'
import { styled } from '@/shared/utils/cn'
import { StyledButton } from '@/shared/components'
import { MicWaveform } from './MicWaveform'
import type { Question } from '@/features/admin/types'
import { COLORS } from '@/shared/constants/user-color'
import beginPreparingSound from '@/assets/sounds/instructions/begin-preparing-now.mp3'
import beginSpeakingSound from '@/assets/sounds/instructions/begin-speaking-now.mp3'

const { Title, Text, Paragraph } = Typography

const Container = styled('div', 'h-full flex gap-4 flex-col')
const QuestionCard = styled(Card, 'flex-1 rounded-lg! mb-4 overflow-y-auto')
const ControlPanel = styled(Card, 'mt-auto rounded-lg!')
const AudioIcon = styled(
  'button',
  'inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors cursor-pointer border-0',
)

interface FullTestQuestionViewProps {
  question: Question
  onRecordingComplete: (audioBlob: Blob) => Promise<void>
  onCancel: () => void
  isLastQuestion?: boolean
}

type RecordingState = 'preparing' | 'recording'

export function FullTestQuestionView({
  question,
  onRecordingComplete,
  onCancel,
}: FullTestQuestionViewProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>('preparing')
  const [prepTimeLeft, setPrepTimeLeft] = useState(question.prepTimeSeconds)
  const [recordTimeLeft, setRecordTimeLeft] = useState(question.responseTimeSeconds)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [recordingStream, setRecordingStream] = useState<MediaStream | null>(null)
  const [canStartTimer, setCanStartTimer] = useState(false) // Wait for audio to finish

  const contextAudioRef = useRef<HTMLAudioElement>(null)
  const questionAudioRef = useRef<HTMLAudioElement>(null)
  const beginPreparingRef = useRef<HTMLAudioElement>(null)
  const beginSpeakingRef = useRef<HTMLAudioElement>(null)
  const prepTimerRef = useRef<number | null>(null)
  const recordTimerRef = useRef<number | null>(null)

  // Auto-play audio sequence when question loads
  useEffect(() => {
    const playAudioSequence = async () => {
      try {
        // For Part 3: Play context audio first
        if (question.partNumber === 3 && question.contextAudioUrl && contextAudioRef.current) {
          await contextAudioRef.current.play()
          await new Promise<void>((resolve) => {
            if (contextAudioRef.current) {
              contextAudioRef.current.onended = () => resolve()
            }
          })
        }

        // For Part 3 & 4: Play question audio before preparation
        if (
          (question.partNumber === 3 || question.partNumber === 4) &&
          question.questionAudioUrl &&
          questionAudioRef.current
        ) {
          await questionAudioRef.current.play()
          await new Promise<void>((resolve) => {
            if (questionAudioRef.current) {
              questionAudioRef.current.onended = () => resolve()
            }
          })
        }

        // For Part 5: Play question audio before preparation
        if (question.partNumber === 5 && question.questionAudioUrl && questionAudioRef.current) {
          await questionAudioRef.current.play()
          await new Promise<void>((resolve) => {
            if (questionAudioRef.current) {
              questionAudioRef.current.onended = () => resolve()
            }
          })
        }

        // Play "begin preparing now" sound
        if (beginPreparingRef.current) {
          await beginPreparingRef.current.play()
          await new Promise<void>((resolve) => {
            if (beginPreparingRef.current) {
              beginPreparingRef.current.onended = () => resolve()
            }
          })
        }

        // Now can start prep timer
        setCanStartTimer(true)
      } catch (error) {
        console.log('Auto-play blocked or failed:', error)
        // If auto-play fails, still allow timer to start
        setCanStartTimer(true)
      }
    }

    playAudioSequence()
  }, [question.id, question.partNumber, question.contextAudioUrl, question.questionAudioUrl])

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
      // Play "begin speaking now" sound first
      if (beginSpeakingRef.current) {
        await beginSpeakingRef.current.play()
        await new Promise<void>((resolve) => {
          if (beginSpeakingRef.current) {
            beginSpeakingRef.current.onended = () => resolve()
          }
        })
      }

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
        const blob = new Blob(chunks, { type: 'audio/webm' })
        stream.getTracks().forEach((track) => track.stop())
        setRecordingStream(null)

        try {
          await onRecordingComplete(blob)
        } catch (error) {
          console.error('Failed to save audio:', error)
          message.error('Lỗi khi lưu bài tập')
        }
      }

      recorder.start()
      setMediaRecorder(recorder)
      setRecordingState('recording')
      setCanStartTimer(true) // Start record timer after audio
    } catch (error) {
      console.error('Failed to start recording:', error)
      message.error('Không thể bắt đầu ghi âm')
    }
  }, [onRecordingComplete])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording()
    }
  }, [stopRecording])

  // Prep timer - only start after audio finishes
  useEffect(() => {
    if (recordingState !== 'preparing' || !canStartTimer) return

    prepTimerRef.current = setInterval(() => {
      setPrepTimeLeft((prev) => {
        const next = prev - 1
        if (next <= 0) {
          // Timer reached 0, trigger recording start
          if (prepTimerRef.current) clearInterval(prepTimerRef.current)
          setTimeout(() => {
            setCanStartTimer(false)
            startRecording()
          }, 0)
        }
        return next
      })
    }, 1000)

    return () => {
      if (prepTimerRef.current) clearInterval(prepTimerRef.current)
    }
  }, [recordingState, canStartTimer, startRecording])

  // Record timer - only start after audio finishes
  useEffect(() => {
    if (recordingState !== 'recording' || !canStartTimer) return

    recordTimerRef.current = setInterval(() => {
      setRecordTimeLeft((prev) => {
        const next = prev - 1
        if (next <= 0) {
          // Timer reached 0, stop recording
          if (recordTimerRef.current) clearInterval(recordTimerRef.current)
          setTimeout(() => {
            stopRecording()
          }, 0)
        }
        return next
      })
    }, 1000)

    return () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current)
    }
  }, [recordingState, canStartTimer, stopRecording])

  const playAudio = (audioRef: React.RefObject<HTMLAudioElement | null>) => {
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
      {/* Hidden audio elements */}
      {question.contextAudioUrl && (
        <audio ref={contextAudioRef} src={question.contextAudioUrl} preload="auto" />
      )}
      {question.questionAudioUrl && (
        <audio ref={questionAudioRef} src={question.questionAudioUrl} preload="auto" />
      )}
      <audio ref={beginPreparingRef} src={beginPreparingSound} preload="auto" />
      <audio ref={beginSpeakingRef} src={beginSpeakingSound} preload="auto" />

      <QuestionCard>
        <Flex vertical gap={16}>
          {/* Header */}
          <Flex align="center" justify="space-between">
            <Space>
              <Tag color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>
                Câu {question.questionNumber}
              </Tag>
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
          {/* Left: Circular countdown */}
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
          </div>

          {/* Right: Cancel button */}
          <div style={{ width: 120, flexShrink: 0 }}>
            <StyledButton danger onClick={onCancel} style={{ width: '100%' }}>
              Hủy làm đề
            </StyledButton>
          </div>
        </Flex>
      </ControlPanel>
    </Container>
  )
}

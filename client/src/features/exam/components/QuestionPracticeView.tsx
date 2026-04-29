import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, Typography, Tag, Flex, Space, Progress, Tooltip } from 'antd'
import { Mic, Stop, Refresh, Cancel, VolumeUp } from '@mui/icons-material'
import { styled } from '@/shared/utils/cn'
import { StyledButton } from '@/shared/components'
import { useMicPermission } from '@/features/exam/hooks/useMicPermission'
import { MicWaveform } from './MicWaveform'
import type { Question } from '@/features/admin/types'
import { hexToRgba } from '@/shared/utils/color'
import { COLORS } from '@/shared/constants/user-color'

const { Title, Text, Paragraph } = Typography

const Container = styled('div', 'h-full flex gap-4 flex-col')
const QuestionCard = styled(Card, 'flex-1 mb-4 overflow-y-auto')
const ControlPanel = styled(Card, 'mt-auto')
const AudioIcon = styled(
  'button',
  'inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors cursor-pointer border-0',
)

interface QuestionPracticeViewProps {
  question: Question & { examSetTitle: string }
  onRecordingComplete: (audioBlob: Blob) => void
  isSubmitting?: boolean
}

type RecordingState = 'idle' | 'preparing' | 'recording' | 'completed'

export function QuestionPracticeView({
  question,
  onRecordingComplete,
  isSubmitting = false,
}: QuestionPracticeViewProps) {
  const { hasPermission, requestPermission } = useMicPermission()
  const [recordingState, setRecordingState] = useState<RecordingState>('idle')
  const [prepTimeLeft, setPrepTimeLeft] = useState(question.prepTimeSeconds)
  const [recordTimeLeft, setRecordTimeLeft] = useState(question.responseTimeSeconds)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [recordingStream, setRecordingStream] = useState<MediaStream | null>(null)

  const contextAudioRef = useRef<HTMLAudioElement>(null!)
  const questionAudioRef = useRef<HTMLAudioElement>(null!)

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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      setRecordingStream(stream)

      const recorder = new MediaRecorder(stream)
      const chunks: Blob[] = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data)
        }
      }

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        onRecordingComplete(blob)
        setRecordingState('completed')
        stream.getTracks().forEach((track) => track.stop())
        setRecordingStream(null)
      }

      recorder.start()
      setMediaRecorder(recorder)
      setRecordingState('recording')
    } catch (error) {
      console.error('Failed to start recording:', error)
      setRecordingState('idle')
    }
  }, [onRecordingComplete])

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

    setPrepTimeLeft(question.prepTimeSeconds)
    setRecordTimeLeft(question.responseTimeSeconds)
    setRecordingState('preparing')
  }

  const handleCancel = () => {
    stopRecording()
    setRecordingState('idle')
    setPrepTimeLeft(question.prepTimeSeconds)
    setRecordTimeLeft(question.responseTimeSeconds)
  }

  const handleReset = () => {
    setRecordingState('idle')
    setPrepTimeLeft(question.prepTimeSeconds)
    setRecordTimeLeft(question.responseTimeSeconds)
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

      {/* Question Content */}
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
            {recordingState === 'idle' && <div style={{ width: 80, height: 80 }} />}
            {recordingState === 'completed' && (
              <Flex vertical align="center" justify="center" style={{ height: 80 }}>
                <Text strong style={{ color: '#52c41a', fontSize: 14, textAlign: 'center' }}>
                  ✓ Hoàn thành
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
            {recordingState === 'idle' && (
              <Flex align="center" justify="center" style={{ height: 80 }}>
                <Text type="secondary">Nhấn nút để bắt đầu</Text>
              </Flex>
            )}
            {recordingState === 'completed' && (
              <Flex align="center" justify="center" style={{ height: 80 }}>
                <Text type="secondary">Đã lưu bài tập</Text>
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

            {recordingState === 'completed' && (
              <StyledButton
                size="large"
                type="primary"
                icon={<Refresh style={{ fontSize: 20 }} />}
                onClick={handleReset}
                disabled={isSubmitting}
                shadowColor={hexToRgba(COLORS.primary, 0.6)}
                style={{
                  width: '100%',
                  backgroundColor: COLORS.primary,
                  borderColor: COLORS.primary,
                }}
              >
                Luyện lại
              </StyledButton>
            )}
          </Flex>
        </Flex>
      </ControlPanel>
    </Container>
  )
}

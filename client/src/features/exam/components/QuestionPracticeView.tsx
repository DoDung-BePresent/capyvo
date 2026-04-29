import { useState, useEffect, useCallback } from 'react'
import { Card, Typography, Tag, Flex, Space, Progress } from 'antd'
import { Mic, Stop, Refresh, Cancel } from '@mui/icons-material'
import { styled } from '@/shared/utils/cn'
import { StyledButton } from '@/shared/components'
import { useMicPermission } from '@/features/exam/hooks/useMicPermission'
import { MicWaveform } from './MicWaveform'
import type { Question } from '@/features/admin/types'
import { hexToRgba } from '@/shared/utils/color'
import { COLORS } from '@/shared/constants/user-color'

const { Title, Text, Paragraph } = Typography

const Container = styled('div', 'h-full flex flex-col')
const QuestionCard = styled(Card, 'flex-1 mb-4')
const ControlPanel = styled(Card, 'mt-auto')

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

  // Cleanup on unmount or question change
  useEffect(() => {
    return () => {
      stopRecording()
    }
  }, [stopRecording])

  // Prep timer - auto start recording when prep time ends
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

  // Record timer - auto stop when time ends
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

  const getQuestionContent = () => {
    if (question.contentText) return question.contentText
    if (question.questionText) return question.questionText
    if (question.contextText) return question.contextText
    return null
  }

  const prepProgress = ((question.prepTimeSeconds - prepTimeLeft) / question.prepTimeSeconds) * 100
  const recordProgress =
    ((question.responseTimeSeconds - recordTimeLeft) / question.responseTimeSeconds) * 100

  return (
    <Container>
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

          {/* Question Text */}
          {getQuestionContent() && (
            <div>
              <Title level={4} style={{ marginBottom: 16 }}>
                Nội dung câu hỏi
              </Title>
              <Paragraph style={{ fontSize: 16, lineHeight: 1.8 }}>
                {getQuestionContent()}
              </Paragraph>
            </div>
          )}

          {/* Images */}
          {question.imageUrls && question.imageUrls.length > 0 && (
            <div>
              <Title level={5} style={{ marginBottom: 12 }}>
                Hình ảnh
              </Title>
              <Flex gap={12} wrap="wrap">
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

          {/* Context Audio */}
          {question.contextAudioUrl && (
            <div>
              <Title level={5} style={{ marginBottom: 12 }}>
                Audio ngữ cảnh
              </Title>
              <audio controls src={question.contextAudioUrl} style={{ width: '100%' }} />
            </div>
          )}

          {/* Question Audio */}
          {question.questionAudioUrl && (
            <div>
              <Title level={5} style={{ marginBottom: 12 }}>
                Audio câu hỏi
              </Title>
              <audio controls src={question.questionAudioUrl} style={{ width: '100%' }} />
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

          {/* Center: Waveform (only when recording) */}
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
                {/* {recordingState === 'recording' && ( */}
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
                {/* )} */}
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

import { useState, useEffect, useCallback } from 'react'
import { Card, Button, Typography, Tag, Flex, Progress, Space } from 'antd'
import { Mic, Stop, Refresh } from '@mui/icons-material'
import { styled } from '@/shared/utils/cn'
import { useMicPermission } from '@/features/exam/hooks/useMicPermission'
import { MicWaveform } from './MicWaveform'
import type { Question } from '@/features/admin/types'

const { Title, Text, Paragraph } = Typography

const Container = styled('div', 'h-full flex flex-col')
const QuestionCard = styled(Card, 'flex-1 mb-4')
const ControlPanel = styled(Card, 'mt-auto')
const RecordButton = styled(Button, 'w-full h-16 text-lg font-semibold')

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
      // Use setTimeout to avoid setState in effect
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
      // Use setTimeout to avoid setState in effect
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

  const handleReset = () => {
    stopRecording()
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
        <Flex vertical gap={16}>
          {/* Status */}
          {recordingState === 'preparing' && (
            <div>
              <Flex align="center" justify="space-between" style={{ marginBottom: 8 }}>
                <Text strong>Thời gian chuẩn bị</Text>
                <Text strong style={{ fontSize: 18, color: '#1890ff' }}>
                  {prepTimeLeft}s
                </Text>
              </Flex>
              <Progress percent={prepProgress} showInfo={false} strokeColor="#1890ff" />
            </div>
          )}

          {recordingState === 'recording' && (
            <div>
              <Flex align="center" justify="space-between" style={{ marginBottom: 8 }}>
                <Text strong>Đang ghi âm</Text>
                <Text strong style={{ fontSize: 18, color: '#ff4d4f' }}>
                  {recordTimeLeft}s
                </Text>
              </Flex>
              <Progress percent={recordProgress} showInfo={false} strokeColor="#ff4d4f" />
              {recordingStream && (
                <div style={{ marginTop: 12 }}>
                  <MicWaveform stream={recordingStream} />
                </div>
              )}
            </div>
          )}

          {recordingState === 'completed' && (
            <Flex align="center" justify="center" style={{ padding: '12px 0' }}>
              <Text strong style={{ color: '#52c41a', fontSize: 16 }}>
                ✓ Đã hoàn thành ghi âm
              </Text>
            </Flex>
          )}

          {/* Actions */}
          <Flex gap={12}>
            {recordingState === 'idle' && (
              <RecordButton
                type="primary"
                icon={<Mic style={{ fontSize: 24 }} />}
                onClick={startPreparing}
                disabled={isSubmitting}
              >
                Bắt đầu luyện tập
              </RecordButton>
            )}

            {recordingState === 'recording' && (
              <RecordButton danger icon={<Stop style={{ fontSize: 24 }} />} onClick={stopRecording}>
                Dừng ghi âm
              </RecordButton>
            )}

            {recordingState === 'completed' && (
              <RecordButton
                icon={<Refresh style={{ fontSize: 24 }} />}
                onClick={handleReset}
                disabled={isSubmitting}
              >
                Luyện lại
              </RecordButton>
            )}
          </Flex>
        </Flex>
      </ControlPanel>
    </Container>
  )
}

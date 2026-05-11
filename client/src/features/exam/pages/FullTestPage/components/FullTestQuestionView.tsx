import { Card, Typography, Tag, Flex, Space, Progress, message } from 'antd'

/**
 * Hooks
 */
import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Utils
 */
import { styled } from '@/shared/utils/cn'

/**
 * Components
 */
import { StyledButton } from '@/shared/components'
import { MicWaveform } from '@/features/exam/components/MicWaveform'

/**
 * Types
 */
import type { Question } from '@/shared/types/domain'

/**
 * Constants
 */
import { COLORS } from '@/shared/constants/user-color'

/**
 * Assets
 */
import beginPreparingSound from '@/assets/sounds/instructions/begin-preparing-now.mp3'
import beginSpeakingSound from '@/assets/sounds/instructions/begin-speaking-now.mp3'

const { Text, Paragraph } = Typography

const Container = styled('div', 'h-full flex gap-4 flex-col')
const QuestionCard = styled(Card, 'flex-1 rounded-lg! mb-4 overflow-y-auto')
const ControlPanel = styled(Card, 'mt-auto rounded-lg!')

interface FullTestQuestionViewProps {
  question: Question
  onRecordingComplete: (audioBlob: Blob) => Promise<void>
  onCancel: () => void
  skipContextAudio?: boolean // For Part 3 & 4: skip context audio if already played
  onContextPlayed?: () => void // Callback when context audio is played
  isLastQuestion?: boolean
}

type RecordingState = 'preparing' | 'recording'

export function FullTestQuestionView({
  question,
  onRecordingComplete,
  onCancel,
  skipContextAudio = false,
  onContextPlayed,
}: FullTestQuestionViewProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>('preparing')
  const [prepTimeLeft, setPrepTimeLeft] = useState(question.prepTimeSeconds)
  const [recordTimeLeft, setRecordTimeLeft] = useState(question.responseTimeSeconds)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [recordingStream, setRecordingStream] = useState<MediaStream | null>(null)
  const [canStartTimer, setCanStartTimer] = useState(false) // Wait for audio to finish
  const [showContext, setShowContext] = useState(false) // For Part 3: show context first
  const [showQuestion, setShowQuestion] = useState(false) // For Part 3: show question after context
  const [part4ReadingTime, setPart4ReadingTime] = useState(45) // For Part 4: 45s to read context
  const [isInPart4Reading, setIsInPart4Reading] = useState(false) // For Part 4: reading phase

  const contextAudioRef = useRef<HTMLAudioElement>(null)
  const questionAudioRef = useRef<HTMLAudioElement>(null)
  const beginPreparingRef = useRef<HTMLAudioElement>(null)
  const beginSpeakingRef = useRef<HTMLAudioElement>(null)
  const prepTimerRef = useRef<number | null>(null)
  const recordTimerRef = useRef<number | null>(null)
  const part4ReadingTimerRef = useRef<number | null>(null)

  // Auto-play audio sequence when question loads
  useEffect(() => {
    const playAudioSequence = async () => {
      try {
        // Part 3: Context audio only plays once for all 3 questions (5, 6, 7)
        if (question.partNumber === 3) {
          // Play context audio only if not played yet
          if (!skipContextAudio && question.contextAudioUrl && contextAudioRef.current) {
            setShowContext(true)
            await contextAudioRef.current.play()
            await new Promise<void>((resolve) => {
              if (contextAudioRef.current) {
                contextAudioRef.current.onended = () => resolve()
              }
            })
            onContextPlayed?.()
          } else if (skipContextAudio) {
            // If context already played, just show it
            setShowContext(true)
          }

          // Play question audio
          if (question.questionAudioUrl && questionAudioRef.current) {
            setShowQuestion(true)
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

          setCanStartTimer(true)
          return
        }

        // Part 4: Show image + context text for 45s → play context audio once → play question audio → "begin preparing"
        if (question.partNumber === 4) {
          // First question in Part 4: Give 45s to read context
          if (!skipContextAudio) {
            setIsInPart4Reading(true)
            // Start 45s countdown timer
            part4ReadingTimerRef.current = setInterval(() => {
              setPart4ReadingTime((prev) => prev - 1)
            }, 1000)

            // Wait 45 seconds for reading
            await new Promise<void>((resolve) => {
              setTimeout(() => {
                if (part4ReadingTimerRef.current) {
                  clearInterval(part4ReadingTimerRef.current)
                }
                resolve()
              }, 45000)
            })
            setIsInPart4Reading(false)
            setPart4ReadingTime(45) // Reset for next time

            // Play context audio once
            if (question.contextAudioUrl && contextAudioRef.current) {
              await contextAudioRef.current.play()
              await new Promise<void>((resolve) => {
                if (contextAudioRef.current) {
                  contextAudioRef.current.onended = () => resolve()
                }
              })
              onContextPlayed?.()
            }
          }

          // Play question audio
          if (question.questionAudioUrl && questionAudioRef.current) {
            await questionAudioRef.current.play()
            await new Promise<void>((resolve) => {
              if (questionAudioRef.current) {
                questionAudioRef.current.onended = () => resolve()
              }
            })

            // Question 10: Play question audio twice
            if (question.questionNumber === 10) {
              await questionAudioRef.current.play()
              await new Promise<void>((resolve) => {
                if (questionAudioRef.current) {
                  questionAudioRef.current.onended = () => resolve()
                }
              })
            }
          }

          // Play "begin preparing now" sound AFTER question audio
          if (beginPreparingRef.current) {
            await beginPreparingRef.current.play()
            await new Promise<void>((resolve) => {
              if (beginPreparingRef.current) {
                beginPreparingRef.current.onended = () => resolve()
              }
            })
          }

          setCanStartTimer(true)
          return
        }

        // Part 5: Play question audio before preparation
        if (question.partNumber === 5 && question.questionAudioUrl && questionAudioRef.current) {
          await questionAudioRef.current.play()
          await new Promise<void>((resolve) => {
            if (questionAudioRef.current) {
              questionAudioRef.current.onended = () => resolve()
            }
          })
        }

        // For Part 1, 2, 5: Play "begin preparing now" sound
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
  }, [
    question.id,
    question.partNumber,
    question.questionNumber,
    question.contextAudioUrl,
    question.questionAudioUrl,
    skipContextAudio,
    onContextPlayed,
  ])

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
        <Flex
          vertical
          gap={16}
          style={{
            maxWidth: 700,
            marginInline: 'auto',
          }}
        >
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

          {/* Images - Always show for all parts */}
          {question.imageUrls && question.imageUrls.length > 0 && (
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
          )}

          {/* Context Text - For Part 3 when showContext, and Part 4 during reading phase */}
          {((question.partNumber === 3 && showContext) ||
            (question.partNumber === 4 && isInPart4Reading)) &&
            question.contextText && (
              <Paragraph
                style={{
                  fontSize: 16,
                  lineHeight: 1.8,
                  textAlign: 'justify',
                }}
              >
                {question.contextText}
              </Paragraph>
            )}

          {/* Question Text - Show for Part 1, 2, 5, and Part 3 when showQuestion is true */}
          {(question.partNumber === 1 ||
            question.partNumber === 2 ||
            question.partNumber === 5 ||
            (question.partNumber === 3 && showQuestion)) &&
            (question.contentText || question.questionText) && (
              <Paragraph style={{ fontSize: 16, lineHeight: 1.8, textAlign: 'justify' }}>
                {question.contentText || question.questionText}
              </Paragraph>
            )}
        </Flex>
      </QuestionCard>

      {/* Control Panel */}
      <ControlPanel>
        <Flex align="center" justify="space-between" gap={16}>
          {/* Left: Circular countdown */}
          <div style={{ width: 80, flexShrink: 0 }}>
            {/* Part 4 Reading Timer */}
            {isInPart4Reading && (
              <Flex vertical align="center" gap={4}>
                <Progress
                  type="circle"
                  percent={((45 - part4ReadingTime) / 45) * 100}
                  format={() => `${part4ReadingTime}s`}
                  strokeColor="#52c41a"
                  strokeWidth={10}
                  size={80}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Đọc context
                </Text>
              </Flex>
            )}
            {!isInPart4Reading && recordingState === 'preparing' && (
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
            {isInPart4Reading && (
              <Flex align="center" justify="center" style={{ height: 80 }}>
                <Text type="secondary">Đang đọc context...</Text>
              </Flex>
            )}
            {!isInPart4Reading && recordingState === 'preparing' && (
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

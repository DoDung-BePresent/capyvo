import { useEffect, useRef } from 'react'
import { Button } from 'antd'
import { RightOutlined } from '@ant-design/icons'

import { PART_META } from '@/features/admin/types'

const PART_DIRECTIONS: Record<number, string> = {
  1: 'In this part of the test, you will read aloud the text on the screen. You will have 45 seconds to prepare. Then you will have 45 seconds to read the text aloud.',
  2: 'In this part of the test, you will describe the picture on your screen in as much detail as you can. You will have 45 seconds to prepare your response. Then you will have 30 seconds to speak about the picture.',
  3: 'In this part of the test, you will answer three questions. You will have three seconds to prepare after you hear each question. You will have 15 seconds to respond to Questions 5 and 6, and 30 seconds to respond to Question 7.',
  4: 'In this part of the test, you will answer three questions based on the information provided. You will have 45 seconds to read the information before the questions begin. You will have three seconds to prepare and 15 seconds to respond to Questions 8 and 9. You will hear Question 10 two times. You will have three seconds to prepare and 30 seconds to respond to Question 10.',
  5: 'In this part of the test, you will give your opinion about a specific topic. Be sure to say as much as you can in the time allowed. You will have 45 seconds to prepare. Then you will have 60 seconds to speak.',
}

export function InstructionScreen({
  partNumber,
  audioSequence,
  onContinue,
}: {
  partNumber: number
  audioSequence: string[]
  onContinue: () => void
}) {
  const meta = PART_META[partNumber as keyof typeof PART_META]
  const qNums = [...meta.questionNumbers]
  const qRange =
    qNums.length > 1 ? `Questions ${qNums[0]}-${qNums[qNums.length - 1]}` : `Question ${qNums[0]}`
  const shortDesc = meta.description.split(': ')[1] ?? meta.description

  // Stable ref so the effect doesn't need `onContinue` in its deps array.
  const onContinueRef = useRef(onContinue)
  useEffect(() => {
    onContinueRef.current = onContinue
  })

  useEffect(() => {
    if (!audioSequence.length) return
    let cancelled = false
    let current: HTMLAudioElement | null = null

    const playAt = (i: number) => {
      if (cancelled) return
      if (i >= audioSequence.length) {
        onContinueRef.current()
        return
      }
      current = new Audio(audioSequence[i])
      current.onended = () => playAt(i + 1)
      current.onerror = () => playAt(i + 1)
      current.play().catch(() => playAt(i + 1))
    }

    playAt(0)

    return () => {
      cancelled = true
      if (current) {
        current.pause()
        current.src = ''
      }
    }
  }, [audioSequence])

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F5F0CC',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '48px 80px',
      }}
    >
      <div style={{ maxWidth: 720, width: '100%' }}>
        <p
          style={{
            textAlign: 'center',
            fontWeight: 700,
            fontSize: 20,
            marginBottom: 32,
            color: '#1a1a1a',
          }}
        >
          {qRange}: {shortDesc}
        </p>
        <p style={{ fontSize: 17, lineHeight: 2.0, color: '#1a1a1a', margin: 0 }}>
          <strong>Directions: </strong>
          {PART_DIRECTIONS[partNumber]}
        </p>
        {/* Fallback button shown only when no audio is configured */}
        {!audioSequence.length && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 40 }}>
            <Button
              type="primary"
              size="large"
              icon={<RightOutlined />}
              iconPosition="end"
              onClick={onContinue}
            >
              Tiếp tục
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

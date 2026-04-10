import { useEffect, useReducer, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button, Image, Modal, Spin, Typography } from 'antd'
import { RightOutlined } from '@ant-design/icons'

import { PART_META } from '@/features/admin/types'
import type { Question } from '@/features/admin/types'
import { instructionService } from '@/features/admin/services/instruction.service'
import { systemAudioService } from '@/features/admin/services/system-audio.service'
import { queryKeys } from '@/lib/query-keys'
import { responseService } from '@/features/exam/services/response.service'
import { sessionService } from '@/features/exam/services/session.service'
import { MicWaveform } from './MicWaveform'

// ─── Directions text per part ─── //
const PART_DIRECTIONS: Record<number, string> = {
  1: 'In this part of the test, you will read aloud the text on the screen. You will have 45 seconds to prepare. Then you will have 45 seconds to read the text aloud.',
  2: 'In this part of the test, you will describe the picture on your screen in as much detail as you can. You will have 45 seconds to prepare your response. Then you will have 30 seconds to speak about the picture.',
  3: 'In this part of the test, you will answer three questions. For each question, begin responding immediately after you hear a beep. No preparation time is given. You will have 15 seconds to respond to Questions 5 and 6 and 30 seconds to respond to Question 7.',
  4: 'In this part of the test, you will answer three questions based on the information provided. You will have 45 seconds to read the information before the questions begin. For each question, begin responding immediately after you hear a beep.',
  5: 'In this part of the test, you will give your opinion about a specific topic. Be sure to say as much as you can in the time allowed. You will have 45 seconds to prepare. Then you will have 60 seconds to speak.',
}

// ─── Phase model ─── //
type Phase =
  | { kind: 'instruction'; partNumber: number }
  | { kind: 'prep_signal'; question: Question; totalSeconds: number } // show question, play START_SPEAKING, timer frozen
  | { kind: 'prep'; question: Question; totalSeconds: number } // timer counting
  | { kind: 'response_signal'; question: Question; totalSeconds: number } // play START_RESPONSE, timer frozen
  | { kind: 'response'; question: Question; totalSeconds: number } // timer counting
  | { kind: 'done' }

function buildPhases(questions: Question[]): Phase[] {
  const sorted = [...questions].sort((a, b) => a.questionNumber - b.questionNumber)
  const phases: Phase[] = []
  let lastPart = 0

  for (const q of sorted) {
    if (q.partNumber !== lastPart) {
      phases.push({ kind: 'instruction', partNumber: q.partNumber })
      lastPart = q.partNumber
    }
    phases.push({ kind: 'prep_signal', question: q, totalSeconds: q.prepTimeSeconds })
    phases.push({ kind: 'prep', question: q, totalSeconds: q.prepTimeSeconds })
    phases.push({ kind: 'response_signal', question: q, totalSeconds: q.responseTimeSeconds })
    phases.push({ kind: 'response', question: q, totalSeconds: q.responseTimeSeconds })
  }

  phases.push({ kind: 'done' })
  return phases
}

// ─── Reducer ─── //
type State = { phases: Phase[]; phaseIndex: number; secondsLeft: number; responseEnded: boolean }
type Action =
  | { type: 'init'; phases: Phase[] }
  | { type: 'next' }
  | { type: 'tick' }
  | { type: 'response_saved' }

function phaseInitSeconds(phase: Phase | undefined): number {
  if (
    phase?.kind === 'prep_signal' ||
    phase?.kind === 'prep' ||
    phase?.kind === 'response_signal' ||
    phase?.kind === 'response'
  ) {
    return phase.totalSeconds
  }
  return 0
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'init': {
      return {
        phases: action.phases,
        phaseIndex: 0,
        secondsLeft: phaseInitSeconds(action.phases[0]),
        responseEnded: false,
      }
    }
    case 'next': {
      const next = state.phaseIndex + 1
      return {
        ...state,
        phaseIndex: next,
        secondsLeft: phaseInitSeconds(state.phases[next]),
        responseEnded: false,
      }
    }
    case 'tick': {
      const s = state.secondsLeft - 1
      const current = state.phases[state.phaseIndex]
      if (s <= 0) {
        if (current?.kind === 'response') {
          // Don't auto-advance — let the saving effect handle it
          return { ...state, secondsLeft: 0, responseEnded: true }
        }
        const next = state.phaseIndex + 1
        return {
          ...state,
          phaseIndex: next,
          secondsLeft: phaseInitSeconds(state.phases[next]),
          responseEnded: false,
        }
      }
      return { ...state, secondsLeft: s }
    }
    case 'response_saved': {
      const next = state.phaseIndex + 1
      return {
        ...state,
        phaseIndex: next,
        secondsLeft: phaseInitSeconds(state.phases[next]),
        responseEnded: false,
      }
    }
    default:
      return state
  }
}

// ─── Helpers ─── //
function formatTime(secs: number): string {
  const s = Math.max(0, secs)
  return `00:${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

// ─── SavingModal ─── //
const { Text } = Typography

function SavingModal({ open }: { open: boolean }) {
  return (
    <Modal
      open={open}
      footer={null}
      closable={false}
      centered
      title={null}
      styles={{ body: { padding: 0, overflow: 'hidden' } }}
    >
      <div
        style={{
          padding: '18px 24px',
          textAlign: 'center',
        }}
      >
        <Text style={{ fontSize: 20, fontWeight: 700 }}>Stop Talking</Text>
      </div>
      <div style={{ padding: '28px 32px', textAlign: 'center' }}>
        <Text style={{ color: '#1D4ED8', fontSize: 15, display: 'block', marginBottom: 10 }}>
          Your response time has ended. Stop speaking now.
        </Text>
        <Text style={{ color: '#1D4ED8', fontSize: 15, display: 'block', marginBottom: 10 }}>
          You will automatically proceed to the next question after your response has been saved.
        </Text>
        <Text style={{ color: '#1D4ED8', fontSize: 15, display: 'block' }}>
          This may take several seconds.
        </Text>
      </div>
    </Modal>
  )
}

// ─── TimerBar ─── //
function TimerBar({
  label,
  seconds,
}: {
  label: 'PREPARATION TIME' | 'RESPONSE TIME'
  seconds: number
}) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#1a1a1a',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '10px 40px',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
        <span
          style={{
            color: '#bbb',
            fontSize: 11,
            letterSpacing: 3,
            fontFamily: '"Courier New", monospace',
            textTransform: 'uppercase',
          }}
        >
          {label}
        </span>
        <span
          style={{
            color: '#fff',
            fontSize: 32,
            fontFamily: '"Courier New", monospace',
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1.1,
          }}
        >
          {formatTime(seconds)}
        </span>
      </div>
    </div>
  )
}

// ─── Instruction screen ─── //
function InstructionScreen({
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

// ─── Question screen ─── //
type TimerPhase = Extract<Phase, { kind: 'prep_signal' | 'prep' | 'response_signal' | 'response' }>

function QuestionScreen({
  phase,
  seconds,
  recordingStream,
}: {
  phase: TimerPhase
  seconds: number
  recordingStream?: MediaStream | null
}) {
  const { question } = phase
  const label =
    phase.kind === 'prep' || phase.kind === 'prep_signal' ? 'PREPARATION TIME' : 'RESPONSE TIME'
  // TimerBar height is ~68px; waveform strip is 72px
  const bottomOffset = 68

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: `60px 80px ${bottomOffset + (recordingStream ? 72 : 0) + 16}px`,
      }}
    >
      <div style={{ maxWidth: 820, width: '100%' }}>
        {question.contentText && (
          <p style={{ fontSize: 18, lineHeight: 2.1, color: '#1a1a1a', margin: 0 }}>
            {question.contentText}
          </p>
        )}

        {question.imageUrls?.[0] && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <Image
              src={question.imageUrls[0]}
              style={{ maxHeight: 380, objectFit: 'contain' }}
              preview={false}
            />
          </div>
        )}

        {question.questionText && (
          <p style={{ fontSize: 18, lineHeight: 2.1, color: '#1a1a1a', marginTop: 24 }}>
            {question.questionText}
          </p>
        )}
      </div>

      {/* Waveform strip above TimerBar */}
      {recordingStream && (
        <div
          style={{
            position: 'fixed',
            bottom: bottomOffset,
            left: 0,
            right: 0,
            backgroundColor: '#111',
            padding: '8px 40px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#ff4d4f',
              flexShrink: 0,
            }}
            className="animate-pulse"
          />
          <div className="w-60">
            <MicWaveform stream={recordingStream} height={40} />
          </div>
        </div>
      )}

      <TimerBar label={label} seconds={seconds} />
    </div>
  )
}

// ─── ExamRunner ─── //
export interface ExamRunnerProps {
  examSetId: string
  questions: Question[]
  isLoading: boolean
  onDone: (sessionId: string) => void
}

export function ExamRunner({ examSetId, questions, isLoading, onDone }: ExamRunnerProps) {
  const [state, dispatch] = useReducer(reducer, {
    phases: [],
    phaseIndex: 0,
    secondsLeft: 0,
    responseEnded: false,
  })

  const { data: partInstructions = [], isLoading: isLoadingInstructions } = useQuery({
    queryKey: queryKeys.partInstructions.all(),
    queryFn: instructionService.getAll,
    staleTime: Infinity,
  })

  const { data: systemAudios = [], isLoading: isLoadingSystemAudio } = useQuery({
    queryKey: queryKeys.systemAudio.all(),
    queryFn: systemAudioService.getAll,
    staleTime: Infinity,
  })

  // ─ Session ─
  const sessionIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!questions.length || sessionIdRef.current) return
    sessionService.createSession(examSetId).then(({ sessionId }) => {
      sessionIdRef.current = sessionId
    })
  }, [questions, examSetId])

  // ─ Recording state ─
  const recorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioStreamRef = useRef<MediaStream | null>(null)
  const [recordingStream, setRecordingStream] = useState<MediaStream | null>(null)
  // Stable ref to the question currently being answered (for upload after stop)
  const currentResponseQuestionRef = useRef<Question | null>(null)

  useEffect(() => {
    if (!questions.length) return
    dispatch({ type: 'init', phases: buildPhases(questions) })
  }, [questions])

  const currentPhase = state.phases[state.phaseIndex] as Phase | undefined

  // Keep question ref in sync (must run every render so no deps)
  useEffect(() => {
    if (currentPhase?.kind === 'response') {
      currentResponseQuestionRef.current = currentPhase.question
    }
  })

  // Timer — pause after responseEnded to prevent double-transition
  useEffect(() => {
    if (currentPhase?.kind !== 'prep' && currentPhase?.kind !== 'response') return
    if (state.responseEnded) return
    const id = setInterval(() => dispatch({ type: 'tick' }), 1000)
    return () => clearInterval(id)
  }, [state.phaseIndex, currentPhase?.kind, state.responseEnded])

  // Play system audio for signal phases and auto-advance when done
  useEffect(() => {
    const kind = currentPhase?.kind
    if (kind !== 'prep_signal' && kind !== 'response_signal') return

    const audioUrl =
      kind === 'prep_signal'
        ? systemAudios.find((a) => a.key === 'START_SPEAKING')?.audioUrl
        : systemAudios.find((a) => a.key === 'START_RESPONSE')?.audioUrl

    if (!audioUrl) {
      dispatch({ type: 'next' })
      return
    }

    let done = false
    const audio = new Audio(audioUrl)
    const advance = () => {
      if (done) return
      done = true
      dispatch({ type: 'next' })
    }
    audio.onended = advance
    audio.onerror = advance
    audio.play().catch(advance)

    return () => {
      done = true
      audio.pause()
      audio.src = ''
    }
  }, [state.phaseIndex, currentPhase?.kind, systemAudios])

  // Start microphone + recorder when response phase begins
  useEffect(() => {
    if (currentPhase?.kind !== 'response') return

    let cancelled = false
    ;(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        audioStreamRef.current = stream
        setRecordingStream(stream)

        audioChunksRef.current = []
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : MediaRecorder.isTypeSupported('audio/webm')
            ? 'audio/webm'
            : ''
        const recorder = mimeType
          ? new MediaRecorder(stream, { mimeType })
          : new MediaRecorder(stream)
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data)
        }
        recorder.start(100)
        recorderRef.current = recorder
      } catch {
        // Microphone unavailable — continue without recording
      }
    })()

    return () => {
      cancelled = true
      setRecordingStream(null)
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recorderRef.current.stop()
      }
      recorderRef.current = null
      audioStreamRef.current?.getTracks().forEach((t) => t.stop())
      audioStreamRef.current = null
    }
  }, [state.phaseIndex, currentPhase?.kind])

  // When response timer ends: stop recorder → upload → advance
  useEffect(() => {
    if (!state.responseEnded) return

    const question = currentResponseQuestionRef.current

    const finalize = async (blob: Blob | null) => {
      setRecordingStream(null)
      audioStreamRef.current?.getTracks().forEach((t) => t.stop())
      audioStreamRef.current = null

      if (blob && blob.size > 0 && question && sessionIdRef.current) {
        try {
          await responseService.saveAudio(sessionIdRef.current, question.id, blob)
        } catch {
          // Upload failure — still proceed to next question
        }
      }
      dispatch({ type: 'response_saved' })
    }

    const recorder = recorderRef.current
    if (!recorder || recorder.state === 'inactive') {
      const blob =
        audioChunksRef.current.length > 0
          ? new Blob(audioChunksRef.current, { type: recorder?.mimeType || 'audio/webm' })
          : null
      finalize(blob)
    } else {
      recorder.onstop = () => {
        const blob =
          audioChunksRef.current.length > 0
            ? new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' })
            : null
        finalize(blob)
      }
      recorder.requestData()
      recorder.stop()
    }
  }, [state.responseEnded])

  const onDoneRef = useRef(onDone)
  useEffect(() => {
    onDoneRef.current = onDone
  })

  useEffect(() => {
    if (currentPhase?.kind !== 'done') return
    const sessionId = sessionIdRef.current ?? ''
    if (sessionId) {
      sessionService
        .completeSession(sessionId)
        .catch(() => {})
        .finally(() => onDoneRef.current(sessionId))
    } else {
      onDoneRef.current(sessionId)
    }
  }, [currentPhase?.kind])

  if (isLoading || isLoadingInstructions || isLoadingSystemAudio || !currentPhase) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Spin size="large" />
      </div>
    )
  }

  if (currentPhase.kind === 'instruction') {
    const instructionAudio =
      partInstructions.find((i) => i.partNumber === currentPhase.partNumber)?.audioUrl ?? null
    const audioSequence = instructionAudio ? [instructionAudio] : []

    return (
      <InstructionScreen
        partNumber={currentPhase.partNumber}
        audioSequence={audioSequence}
        onContinue={() => dispatch({ type: 'next' })}
      />
    )
  }

  if (
    currentPhase.kind === 'prep_signal' ||
    currentPhase.kind === 'prep' ||
    currentPhase.kind === 'response_signal' ||
    currentPhase.kind === 'response'
  ) {
    const isRecording = currentPhase.kind === 'response' && !!recordingStream
    return (
      <>
        <QuestionScreen
          phase={currentPhase}
          seconds={state.secondsLeft}
          recordingStream={isRecording ? recordingStream : null}
        />
        <SavingModal open={state.responseEnded} />
      </>
    )
  }

  return null
}

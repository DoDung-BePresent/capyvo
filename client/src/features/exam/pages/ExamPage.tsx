import { useEffect, useReducer } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Image, Spin } from 'antd'
import { RightOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'

import { examSetService } from '@/features/admin/services/exam-set.service'
import { PART_META } from '@/features/admin/types'
import type { Question } from '@/features/admin/types'
import { queryKeys } from '@/lib/query-keys'

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
  | { kind: 'prep'; question: Question; totalSeconds: number }
  | { kind: 'response'; question: Question; totalSeconds: number }
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
    phases.push({ kind: 'prep', question: q, totalSeconds: q.prepTimeSeconds })
    phases.push({ kind: 'response', question: q, totalSeconds: q.responseTimeSeconds })
  }

  phases.push({ kind: 'done' })
  return phases
}

// ─── Reducer ─── //
type State = { phases: Phase[]; phaseIndex: number; secondsLeft: number }
type Action = { type: 'init'; phases: Phase[] } | { type: 'next' } | { type: 'tick' }

function phaseInitSeconds(phase: Phase | undefined): number {
  return phase?.kind === 'prep' || phase?.kind === 'response' ? phase.totalSeconds : 0
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'init': {
      return {
        phases: action.phases,
        phaseIndex: 0,
        secondsLeft: phaseInitSeconds(action.phases[0]),
      }
    }
    case 'next': {
      const next = state.phaseIndex + 1
      return { ...state, phaseIndex: next, secondsLeft: phaseInitSeconds(state.phases[next]) }
    }
    case 'tick': {
      const s = state.secondsLeft - 1
      if (s <= 0) {
        const next = state.phaseIndex + 1
        return { ...state, phaseIndex: next, secondsLeft: phaseInitSeconds(state.phases[next]) }
      }
      return { ...state, secondsLeft: s }
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

// ─── TimerBar ─── //
function TimerBar({
  label,
  seconds,
  totalSeconds,
}: {
  label: 'PREPARATION TIME' | 'RESPONSE TIME'
  seconds: number
  totalSeconds: number
}) {
  const r = 18
  const circ = 2 * Math.PI * r
  const dashOffset = circ * (1 - Math.max(0, seconds) / (totalSeconds || 1))
  const arcColor = label === 'RESPONSE TIME' ? '#ff4d4f' : '#fa8c16'

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
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          padding: '10px 40px',
          minWidth: 320,
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

        <svg key={`${label}-${totalSeconds}`} width={44} height={44}>
          {/* Track */}
          <circle cx={22} cy={22} r={r} fill="none" stroke="#3a3a3a" strokeWidth={3} />
          {/* Progress arc */}
          <circle
            cx={22}
            cy={22}
            r={r}
            fill="none"
            stroke={arcColor}
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray={`${circ}`}
            strokeDashoffset={`${dashOffset}`}
            transform="rotate(-90 22 22)"
            style={{ transition: 'stroke-dashoffset 0.95s linear' }}
          />
        </svg>
      </div>
    </div>
  )
}

// ─── Instruction screen ─── //
function InstructionScreen({
  partNumber,
  onContinue,
}: {
  partNumber: number
  onContinue: () => void
}) {
  const meta = PART_META[partNumber as keyof typeof PART_META]
  const qNums = [...meta.questionNumbers]
  const qRange =
    qNums.length > 1 ? `Questions ${qNums[0]}-${qNums[qNums.length - 1]}` : `Question ${qNums[0]}`
  const shortDesc = meta.description.split(': ')[1] ?? meta.description

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
      </div>
    </div>
  )
}

// ─── Question screen ─── //
function QuestionScreen({
  phase,
  seconds,
}: {
  phase: Extract<Phase, { kind: 'prep' | 'response' }>
  seconds: number
}) {
  const { question } = phase
  const label = phase.kind === 'prep' ? 'PREPARATION TIME' : 'RESPONSE TIME'

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '60px 80px 120px',
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

      <TimerBar label={label} seconds={seconds} totalSeconds={phase.totalSeconds} />
    </div>
  )
}

// ─── Page ─── //
export default function ExamPage() {
  const { examSetId } = useParams<{ examSetId: string }>()
  const navigate = useNavigate()

  const [state, dispatch] = useReducer(reducer, { phases: [], phaseIndex: 0, secondsLeft: 0 })

  const { data: examSet, isLoading } = useQuery({
    queryKey: queryKeys.examSets.detail(examSetId ?? ''),
    queryFn: () => examSetService.getById(examSetId ?? ''),
    enabled: !!examSetId,
  })

  useEffect(() => {
    if (!examSet?.questions?.length) return
    dispatch({ type: 'init', phases: buildPhases(examSet.questions) })
  }, [examSet])

  const currentPhase = state.phases[state.phaseIndex] as Phase | undefined

  // Countdown interval — restart on every phase change
  useEffect(() => {
    if (currentPhase?.kind !== 'prep' && currentPhase?.kind !== 'response') return
    const id = setInterval(() => dispatch({ type: 'tick' }), 1000)
    return () => clearInterval(id)
  }, [state.phaseIndex, currentPhase?.kind])

  // Navigate away when done
  useEffect(() => {
    if (currentPhase?.kind === 'done') {
      navigate('/', { replace: true })
    }
  }, [currentPhase?.kind, navigate])

  if (isLoading || !currentPhase) {
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
    return (
      <InstructionScreen
        partNumber={currentPhase.partNumber}
        onContinue={() => dispatch({ type: 'next' })}
      />
    )
  }

  if (currentPhase.kind === 'prep' || currentPhase.kind === 'response') {
    return <QuestionScreen phase={currentPhase} seconds={state.secondsLeft} />
  }

  return null
}

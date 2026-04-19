import { useEffect, useReducer, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Spin } from 'antd'

import { instructionService } from '@/features/admin/services/instruction.service'
import { systemAudioService } from '@/features/admin/services/system-audio.service'
import { queryKeys } from '@/lib/query-keys'
import type { Question } from '@/features/admin/types'
import { responseService } from '@/features/exam/services/response.service'
import { sessionService } from '@/features/exam/services/session.service'

import { buildPhases, reducer, type Phase } from './exam-phases'
import { InstructionScreen } from './InstructionScreen'
import { ContextAudioScreen } from './ContextAudioScreen'
import { QuestionScreen, type TimerPhase } from './QuestionScreen'
import { TimerBar } from './TimerBar'
import { SavingModal } from './SavingModal'

// ─── ExamRunner ─── //
export interface ExamRunnerProps {
  examSetId: string
  partNumber?: number
  questions: Question[]
  isLoading: boolean
  onDone: (sessionId: string) => void
}

export function ExamRunner({
  examSetId,
  partNumber,
  questions,
  isLoading,
  onDone,
}: ExamRunnerProps) {
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
    sessionService.createSession(examSetId, partNumber ?? null).then(({ sessionId }) => {
      sessionIdRef.current = sessionId
    })
  }, [questions, examSetId, partNumber])

  // ─ Recording state ─
  const recorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioStreamRef = useRef<MediaStream | null>(null)
  const [recordingStream, setRecordingStream] = useState<MediaStream | null>(null)
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
    if (
      currentPhase?.kind !== 'prep' &&
      currentPhase?.kind !== 'response' &&
      currentPhase?.kind !== 'context_read'
    )
      return
    if (state.responseEnded) return
    const id = setInterval(() => dispatch({ type: 'tick' }), 1000)
    return () => clearInterval(id)
  }, [state.phaseIndex, currentPhase?.kind, state.responseEnded])

  // Play system audio for signal phases and auto-advance when done
  useEffect(() => {
    const kind = currentPhase?.kind
    if (kind !== 'prep_signal' && kind !== 'response_signal' && kind !== 'context_read_signal')
      return

    const audioUrl =
      kind === 'response_signal'
        ? systemAudios.find((a) => a.key === 'START_RESPONSE')?.audioUrl
        : systemAudios.find((a) => a.key === 'START_SPEAKING')?.audioUrl

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

  // Play audio for context / question_audio phases, auto-advance when done
  useEffect(() => {
    if (!currentPhase) return
    if (currentPhase.kind !== 'context' && currentPhase.kind !== 'question_audio') return

    const audioUrl =
      currentPhase.kind === 'context'
        ? currentPhase.question.contextAudioUrl
        : currentPhase.question.questionAudioUrl

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
  }, [state.phaseIndex, currentPhase])

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

  // ─── Render ─── //

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
    return (
      <InstructionScreen
        partNumber={currentPhase.partNumber}
        audioSequence={instructionAudio ? [instructionAudio] : []}
        onContinue={() => dispatch({ type: 'next' })}
      />
    )
  }

  if (currentPhase.kind === 'context' || currentPhase.kind === 'context_read_signal') {
    return <ContextAudioScreen question={currentPhase.question} showQuestion={false} />
  }

  if (currentPhase.kind === 'context_read') {
    return (
      <>
        <ContextAudioScreen question={currentPhase.question} showQuestion={false} />
        <TimerBar label="PREPARATION TIME" seconds={state.secondsLeft} />
      </>
    )
  }

  if (currentPhase.kind === 'question_audio') {
    return <ContextAudioScreen question={currentPhase.question} showQuestion={true} />
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
          phase={currentPhase as TimerPhase}
          seconds={state.secondsLeft}
          recordingStream={isRecording ? recordingStream : null}
        />
        <SavingModal open={state.responseEnded} />
      </>
    )
  }

  return null
}

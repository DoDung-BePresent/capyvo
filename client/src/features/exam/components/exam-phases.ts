import type { Question } from '@/features/admin/types'

// ─── Phase model ─── //
export type Phase =
  | { kind: 'instruction'; partNumber: number }
  | { kind: 'context'; question: Question } // play contextAudioUrl, show context text
  | { kind: 'context_read_signal'; question: Question; totalSeconds: number } // play START_SPEAKING signal, show image/context, timer frozen
  | { kind: 'context_read'; question: Question; totalSeconds: number } // show image + context text with countdown (no audio)
  | { kind: 'question_audio'; question: Question } // play questionAudioUrl, show context + question
  | { kind: 'prep_signal'; question: Question; totalSeconds: number } // play START_SPEAKING, timer frozen
  | { kind: 'prep'; question: Question; totalSeconds: number } // timer counting
  | { kind: 'response_signal'; question: Question; totalSeconds: number } // play START_RESPONSE, timer frozen
  | { kind: 'response'; question: Question; totalSeconds: number } // timer counting, mic recording
  | { kind: 'done' }

export function buildPhases(questions: Question[]): Phase[] {
  const sorted = [...questions].sort((a, b) => a.questionNumber - b.questionNumber)
  const phases: Phase[] = []
  let lastPart = 0
  let lastContextAudioUrl: string | null | undefined = undefined
  // When a context group uses context_read (no audio), that 45s IS the preparation time.
  // Skip individual prep phases for all questions in that group.
  let contextGroupHasReadPhase = false

  for (const q of sorted) {
    if (q.partNumber !== lastPart) {
      phases.push({ kind: 'instruction', partNumber: q.partNumber })
      lastPart = q.partNumber
      lastContextAudioUrl = undefined
      contextGroupHasReadPhase = false
    }

    const isNewContextGroup =
      (q.contextText || q.imageUrls?.length) && q.contextAudioUrl !== lastContextAudioUrl
    if (isNewContextGroup) {
      if (q.contextAudioUrl) {
        phases.push({ kind: 'context', question: q })
        contextGroupHasReadPhase = false
      } else {
        // No audio for this context (e.g. Part 2) — signal then show image/text with reading timer.
        // This 45s reading phase replaces the individual prep phases.
        phases.push({ kind: 'context_read_signal', question: q, totalSeconds: 45 })
        phases.push({ kind: 'context_read', question: q, totalSeconds: 45 })
        contextGroupHasReadPhase = true
      }
      lastContextAudioUrl = q.contextAudioUrl
    }

    if (q.questionAudioUrl) {
      phases.push({ kind: 'question_audio', question: q })
    }
    if (!contextGroupHasReadPhase) {
      phases.push({ kind: 'prep_signal', question: q, totalSeconds: q.prepTimeSeconds })
      phases.push({ kind: 'prep', question: q, totalSeconds: q.prepTimeSeconds })
    }
    phases.push({ kind: 'response_signal', question: q, totalSeconds: q.responseTimeSeconds })
    phases.push({ kind: 'response', question: q, totalSeconds: q.responseTimeSeconds })
  }

  phases.push({ kind: 'done' })
  return phases
}

// ─── Reducer ─── //
export type State = {
  phases: Phase[]
  phaseIndex: number
  secondsLeft: number
  responseEnded: boolean
}

export type Action =
  | { type: 'init'; phases: Phase[] }
  | { type: 'next' }
  | { type: 'tick' }
  | { type: 'response_saved' }

export function phaseInitSeconds(phase: Phase | undefined): number {
  if (
    phase?.kind === 'prep_signal' ||
    phase?.kind === 'prep' ||
    phase?.kind === 'response_signal' ||
    phase?.kind === 'response' ||
    phase?.kind === 'context_read'
  ) {
    return phase.totalSeconds
  }
  return 0
}

export function reducer(state: State, action: Action): State {
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

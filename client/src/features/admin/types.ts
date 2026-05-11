// ─── Re-export shared domain types ─────────────────────────────────────────────
export type { Question, PartNumber, PracticeSet } from '@/shared/types/domain'
export { PART_META } from '@/shared/types/domain'

// ─── ExamSet model ─────────────────────────────────────────────────────────────

export type ExamSetType = 'PRACTICE' | 'FORECAST' | 'CUSTOM'

export interface ExamSet {
  id: string
  title: string
  description: string | null
  type: ExamSetType
  isPublished: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
  _count?: { questions: number }
}

export interface ExamSetWithQuestions extends ExamSet {
  questions: import('@/shared/types/domain').Question[]
}

export interface CreateExamSetPayload {
  title: string
  description?: string
  type: ExamSetType
}

export interface UpdateExamSetPayload {
  title?: string
  description?: string
  type?: ExamSetType
  isPublished?: boolean
}

// ─── SystemAudio model ─────────────────────────────────────────────────────────

export type SystemAudioKey = 'START_SPEAKING' | 'START_RESPONSE'

export const SYSTEM_AUDIO_META: Record<SystemAudioKey, { label: string; description: string }> = {
  START_SPEAKING: {
    label: 'Tín hiệu bắt đầu nói',
    description: 'Phát trước khi thí sinh bắt đầu đọc / trả lời',
  },
  START_RESPONSE: {
    label: 'Tín hiệu bắt đầu phản hồi',
    description: 'Phát khi hệ thống bắt đầu ghi âm câu trả lời',
  },
}

export interface SystemAudio {
  key: SystemAudioKey
  audioUrl: string | null
  updatedAt: string
}

// ─── PartInstruction model ─────────────────────────────────────────────────────

export interface PartInstruction {
  partNumber: number
  audioUrl: string | null
  updatedAt: string
}

// ─── Form values (per part, sent to the UI form) ───────────────────────────────

export interface Part1FormValues {
  questionNumber: 1 | 2
  contentText: string
}

export interface Part2FormValues {
  questionNumber: 3 | 4
  imageUrl: string
  imageContext?: string
}

/** Part 3: fills context once + 3 question texts (→ auto TTS if no audio provided) */
export interface Part3FormValues {
  contextText: string
  contextAudioUrl?: string
  q5: string
  q5AudioUrl?: string
  q6: string
  q6AudioUrl?: string
  q7: string
  q7AudioUrl?: string
}

/** Part 4: 1 shared image + 3 question texts (→ auto TTS if no audio provided) */
export interface Part4FormValues {
  contextText: string
  contextAudioUrl?: string
  imageUrl: string
  imageContext?: string
  q8: string
  q8AudioUrl?: string
  q9: string
  q9AudioUrl?: string
  q10: string
  q10AudioUrl?: string
}

export interface Part5FormValues {
  questionText: string
  questionAudioUrl?: string
}

export interface UpdateQuestionPayload {
  contentText?: string
  contextText?: string
  contextAudioUrl?: string | null
  questionText?: string
  questionAudioUrl?: string | null
  imageUrls?: string[]
  imageContext?: string | null
}

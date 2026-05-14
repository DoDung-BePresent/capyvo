// ─── Re-export shared domain types ─────────────────────────────────────────────
export type { Question, PartNumber, PracticeSet } from '@/shared/types/domain'
export { PART_META } from '@/shared/types/domain'

// ─── Import for internal use ───────────────────────────────────────────────────
import type { Question } from '@/shared/types/domain'

// ─── Question Type and Status Enums ────────────────────────────────────────────

export const QuestionType = {
  PRACTICE: 'PRACTICE',
  FORECAST: 'FORECAST',
  CUSTOM: 'CUSTOM',
} as const

export type QuestionType = (typeof QuestionType)[keyof typeof QuestionType]

export const QuestionStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
} as const

export type QuestionStatus = (typeof QuestionStatus)[keyof typeof QuestionStatus]

// ─── Topic model ───────────────────────────────────────────────────────────────

export interface Topic {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
}

export interface TopicWithCount extends Topic {
  questionCount: number
}

// ─── Question with Topics ──────────────────────────────────────────────────────

export interface QuestionWithTopics {
  id: string
  examSets?: Array<{ id: string; title: string }>
  examSetId?: string | null
  examSet?: { id: string; title: string } | null
  partNumber: number
  questionNumber: number
  type: QuestionType
  status: QuestionStatus
  contentText: string | null
  contextText: string | null
  contextAudioUrl: string | null
  questionText: string | null
  questionAudioUrl: string | null
  imageUrls: string[]
  imageContext: string | null
  prepTimeSeconds: number
  responseTimeSeconds: number
  createdAt: string
  topics: Topic[]
}

// ─── ExamSet model ─────────────────────────────────────────────────────────────

export type ExamSetType = 'PRACTICE' | 'FORECAST' | 'CUSTOM'

export interface ExamSet {
  id: string
  title: string
  description: string | null
  type: ExamSetType
  isPublished: boolean
  isComplete: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
  _count?: { questions: number }
}

export interface ExamSetWithQuestions extends ExamSet {
  questions: Question[]
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
  type?: QuestionType
  status?: QuestionStatus
  topicIds?: string[]
}

export interface Part2FormValues {
  questionNumber: 3 | 4
  imageUrl: string
  imageContext?: string
  type?: QuestionType
  status?: QuestionStatus
  topicIds?: string[]
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
  type?: QuestionType
  status?: QuestionStatus
  topicIds?: string[]
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
  type?: QuestionType
  status?: QuestionStatus
  topicIds?: string[]
}

export interface Part5FormValues {
  questionText: string
  questionAudioUrl?: string
  type?: QuestionType
  status?: QuestionStatus
  topicIds?: string[]
}

export interface UpdateQuestionPayload {
  contentText?: string
  contextText?: string
  contextAudioUrl?: string | null
  questionText?: string
  questionAudioUrl?: string | null
  imageUrls?: string[]
  imageContext?: string | null
  type?: QuestionType
  status?: QuestionStatus
  topicIds?: string[]
}

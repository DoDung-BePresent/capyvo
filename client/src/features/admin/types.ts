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

// ─── PartInstruction model ─────────────────────────────────────────────────────

export interface PartInstruction {
  partNumber: number
  audioUrl: string | null
  updatedAt: string
}

// ─── Question model (matches Prisma/API response) ─────────────────────────────

export interface Question {
  id: string
  examSetId: string | null
  examSet?: { id: string; title: string } | null
  partNumber: number
  questionNumber: number
  contentText: string | null
  contextText: string | null
  contextAudioUrl: string | null
  questionText: string | null
  questionAudioUrl: string | null
  imageUrls: string[]
  prepTimeSeconds: number
  responseTimeSeconds: number
  createdAt: string
}

// ─── Form values (per part, sent to the UI form) ───────────────────────────────

export interface Part1FormValues {
  questionNumber: 1 | 2
  contentText: string
}

export interface Part2FormValues {
  questionNumber: 3 | 4
  imageUrl: string // URL returned after upload
}

/** Part 3: fills context once + 3 question texts (→ auto TTS) */
export interface Part3FormValues {
  contextText: string
  q5: string
  q6: string
  q7: string
}

/** Part 4: 1 shared image + 3 question texts (→ auto TTS) */
export interface Part4FormValues {
  contextText: string
  imageUrl: string
  q8: string
  q9: string
  q10: string
}

export interface Part5FormValues {
  questionText: string
}

// ─── Part metadata ─────────────────────────────────────────────────────────────

export const PART_META = {
  1: {
    label: 'Part 1',
    description: 'Câu 1–2: Read a text aloud',
    questionNumbers: [1, 2],
    prepTime: 45,
    responseTime: 45,
    color: '#4F46E5',
  },
  2: {
    label: 'Part 2',
    description: 'Câu 3–4: Describe a picture',
    questionNumbers: [3, 4],
    prepTime: 45,
    responseTime: 30,
    color: '#7C3AED',
  },
  3: {
    label: 'Part 3',
    description: 'Câu 5–7: Respond to questions',
    questionNumbers: [5, 6, 7],
    prepTime: 3,
    responseTime: 15,
    responseTimeOverride: { 7: 30 },
    color: '#0891B2',
  },
  4: {
    label: 'Part 4',
    description: 'Câu 8–10: Respond using information',
    questionNumbers: [8, 9, 10],
    partPrepTime: 45,
    prepTime: 3,
    responseTime: 15,
    responseTimeOverride: { 10: 30 },
    color: '#059669',
  },
  5: {
    label: 'Part 5',
    description: 'Câu 11: Express an opinion',
    questionNumbers: [11],
    prepTime: 45,
    responseTime: 60,
    color: '#DC2626',
  },
} as const

export type PartNumber = keyof typeof PART_META

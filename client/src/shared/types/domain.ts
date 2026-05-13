// ─── Question model (domain entity) ────────────────────────────────────────────

export interface Question {
  id: string
  // Many-to-many: A question can belong to multiple exam sets
  examSets?: Array<{ id: string; title: string }>
  // Deprecated fields (for backward compatibility during migration)
  examSetId?: string | null
  examSet?: { id: string; title: string } | null
  partNumber: number
  questionNumber: number
  // Question type and status (optional for backward compatibility)
  type?: string
  status?: string
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

// ─── Practice set (grouped questions for practice) ────────────────────────────

export interface PracticeSet {
  examSetId: string
  examSetTitle: string
  questions: Question[]
}

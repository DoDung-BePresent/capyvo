export interface Part1FormValues {
  questionNumber: 1 | 2
  contentText: string
}

export interface Part2FormValues {
  questionNumber: 3 | 4
  contentText: string
}

export interface Part3FormValues {
  questionNumber: 5 | 6 | 7
  contextText: string
  contextAudioUrl: string
  questionText: string
  questionAudioUrl: string
}

export interface Part4FormValues {
  questionNumber: 8 | 9 | 10
  imageUrls: string[]
  questionText: string
  questionAudioUrl: string
}

export interface Part5FormValues {
  questionNumber: 11
  questionText: string
  questionAudioUrl: string
}

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

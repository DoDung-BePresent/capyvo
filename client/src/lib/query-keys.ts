/**
 * Centralized query keys
 * Convention: [feature, ...identifiers]
 */
export const queryKeys = {
  // Auth
  auth: {
    me: () => ['auth', 'me'] as const,
  },

  // Exam sets
  examSets: {
    all: () => ['exam-sets'] as const,
    list: (filters?: Record<string, unknown>) => ['exam-sets', 'list', filters] as const,
    detail: (id: string) => ['exam-sets', 'detail', id] as const,
  },

  // Questions
  questions: {
    byPart: (partNumber: number) => ['questions', 'part', partNumber] as const,
    byExamSet: (examSetId: string) => ['questions', 'exam-set', examSetId] as const,
    detail: (id: string) => ['questions', 'detail', id] as const,
  },

  // Practice sessions
  practiceSessions: {
    all: () => ['practice-sessions'] as const,
    detail: (id: string) => ['practice-sessions', 'detail', id] as const,
    byUser: (userId: string) => ['practice-sessions', 'user', userId] as const,
  },

  // User responses
  responses: {
    bySession: (sessionId: string) => ['responses', 'session', sessionId] as const,
    detail: (id: string) => ['responses', 'detail', id] as const,
  },

  // System audio
  systemAudio: {
    all: () => ['system-audio'] as const,
  },
}

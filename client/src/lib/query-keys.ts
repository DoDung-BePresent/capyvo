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
    published: () => ['exam-sets', 'published'] as const,
    publishedDetail: (id: string) => ['exam-sets', 'published', id] as const,
  },

  // Questions
  questions: {
    byPart: (partNumber: number) => ['questions', 'part', partNumber] as const,
    examSetsByPart: (partNumber: number) => ['questions', 'exam-sets', 'part', partNumber] as const,
    byExamSet: (examSetId: string) => ['questions', 'exam-set', examSetId] as const,
    detail: (id: string) => ['questions', 'detail', id] as const,
    pool: (questionNumber: number, search?: string, assignmentStatus?: string) =>
      ['questions', 'pool', questionNumber, search, assignmentStatus] as const,
    practiceSets: (partNumber: number) => ['questions', 'practice-sets', partNumber] as const,
    byPartAndSet: (partNumber: number, examSetId: string) =>
      ['questions', 'part-set', partNumber, examSetId] as const,
  },

  // Practice sessions
  practiceSessions: {
    all: () => ['practice-sessions'] as const,
    my: () => ['practice-sessions', 'my'] as const,
    detail: (id: string) => ['practice-sessions', 'detail', id] as const,
    byUser: (userId: string) => ['practice-sessions', 'user', userId] as const,
    myBySet: (examSetId: string, partNumber?: number | null) =>
      ['practice-sessions', 'my', examSetId, partNumber ?? null] as const,
    setStats: (examSetId: string, partNumber?: number | null) =>
      ['practice-sessions', 'stats', examSetId, partNumber ?? null] as const,
    completedSetIds: (partNumber?: number | null) =>
      ['practice-sessions', 'my', 'completed-set-ids', partNumber ?? null] as const,
  },

  // User responses
  responses: {
    bySession: (sessionId: string) => ['responses', 'session', sessionId] as const,
    detail: (id: string) => ['responses', 'detail', id] as const,
    questionHistory: (questionId: string) => ['responses', 'question-history', questionId] as const,
  },

  // System stats (storage, AI cost)
  systemStats: {
    all: () => ['system-stats'] as const,
  },

  // Admin dashboard
  adminDashboard: {
    stats: () => ['admin', 'dashboard', 'stats'] as const,
  },

  // OpenAI Usage
  openaiUsage: {
    detailed: (startDate?: string, endDate?: string) =>
      ['admin', 'openai-usage', 'detailed', startDate, endDate] as const,
  },

  // Abuse Detection
  abuseDetection: {
    detect: () => ['admin', 'abuse-detection', 'detect'] as const,
  },

  // Payments
  payments: {
    my: () => ['payments', 'my'] as const,
    status: (orderCode: number) => ['payments', 'status', orderCode] as const,
    tokenPackages: () => ['payments', 'token-packages'] as const,
  },

  // Shares
  shares: {
    byQuestion: (questionId: string) => ['shares', 'question', questionId] as const,
    my: () => ['shares', 'my'] as const,
  },

  // Topics
  topics: {
    list: () => ['topics'] as const,
    detail: (id: string) => ['topics', 'detail', id] as const,
  },
}

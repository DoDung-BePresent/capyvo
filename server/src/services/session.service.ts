import prisma from '@/lib/prisma'
import { NotFoundError } from '@/errors/app-error'

class SessionService {
  async createSession(userId: string, examSetId: string) {
    return prisma.practiceSession.create({
      data: { userId, examSetId, status: 'IN_PROGRESS' },
    })
  }

  async completeSession(id: string, userId: string) {
    const session = await prisma.practiceSession.findFirst({ where: { id, userId } })
    if (!session) throw new NotFoundError('Session')
    return prisma.practiceSession.update({
      where: { id },
      data: { status: 'COMPLETED', completedAt: new Date() },
    })
  }

  async getUserSessionsBySet(userId: string, examSetId: string) {
    return prisma.practiceSession.findMany({
      where: { userId, examSetId },
      include: {
        _count: { select: { userResponses: true } },
        examSet: { select: { title: true } },
      },
      orderBy: { startedAt: 'desc' },
    })
  }

  async getSessionDetail(id: string, userId: string) {
    const session = await prisma.practiceSession.findFirst({
      where: { id, userId },
      include: {
        examSet: { select: { id: true, title: true } },
        userResponses: {
          include: { question: true },
          orderBy: { question: { questionNumber: 'asc' } },
        },
      },
    })
    if (!session) throw new NotFoundError('Session')
    return session
  }

  async getSetStats(examSetId: string) {
    const totalAttempts = await prisma.practiceSession.count({
      where: { examSetId, status: 'COMPLETED' },
    })
    return { totalAttempts }
  }

  async getCompletedSetIds(userId: string) {
    const sessions = await prisma.practiceSession.findMany({
      where: { userId, status: 'COMPLETED' },
      select: { examSetId: true },
      distinct: ['examSetId'],
    })
    return sessions.map((s) => s.examSetId)
  }
}

export const sessionService = new SessionService()

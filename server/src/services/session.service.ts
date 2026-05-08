import prisma from '@/lib/prisma'
import { NotFoundError } from '@/errors/app-error'

export class SessionService {
  async createSession(userId: string, examSetId: string, partNumber?: number | null) {
    return prisma.practiceSession.create({
      data: { userId, examSetId, partNumber: partNumber ?? null, status: 'IN_PROGRESS' },
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

  async getUserSessionsBySet(userId: string, examSetId: string, partNumber?: number | null) {
    return prisma.practiceSession.findMany({
      where: {
        userId,
        examSetId,
        partNumber: partNumber != null ? partNumber : null,
      },
      include: {
        _count: { select: { userResponses: true } },
        examSet: { select: { title: true } },
      },
      orderBy: { startedAt: 'desc' },
    })
  }

  async getAllUserSessions(userId: string) {
    return prisma.practiceSession.findMany({
      where: { userId },
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

  async getSetStats(examSetId: string, partNumber?: number | null) {
    const totalAttempts = await prisma.practiceSession.count({
      where: {
        examSetId,
        status: 'COMPLETED',
        partNumber: partNumber != null ? partNumber : null,
      },
    })
    return { totalAttempts }
  }

  async getCompletedSetIds(userId: string, partNumber?: number | null) {
    const where =
      partNumber != null
        ? { userId, status: 'COMPLETED' as const, partNumber }
        : { userId, status: 'COMPLETED' as const, partNumber: null }
    const sessions = await prisma.practiceSession.findMany({
      where,
      select: { examSetId: true },
      distinct: ['examSetId'],
    })
    return sessions.map((s) => s.examSetId)
  }
}

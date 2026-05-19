import type { Request, Response, NextFunction } from 'express'
import type { AuthRequest } from '@/middlewares/authenticate'
import { SessionService } from '@/services/session.service'

export class SessionController {
  private service = new SessionService()

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as AuthRequest).userId
      const { examSetId, partNumber } = req.body

      // examSetId is optional: null = practice mode, non-null = exam mode
      const effectiveExamSetId = examSetId && examSetId.trim() !== '' ? examSetId : null

      const part = partNumber != null ? Number(partNumber) : null
      const session = await this.service.createSession(userId, effectiveExamSetId, part)
      res.status(201).json({ success: true, data: { sessionId: session.id } })
    } catch (error) {
      // Handle FREE user trying to practice full exam
      if (error instanceof Error && error.message === 'FREE_USER_FULL_EXAM_BLOCKED') {
        res.status(403).json({
          success: false,
          error: 'Premium feature',
          message: 'Luyện full đề chỉ dành cho người dùng Premium. Vui lòng nâng cấp để sử dụng.',
          upgradeUrl: '/pricing',
        })
        return
      }
      next(error)
    }
  }

  async complete(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const userId = (req as AuthRequest).userId
    const id = req.params.id as string
    await this.service.completeSession(id, userId)
    res.json({ success: true })
  }

  async myBySet(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const userId = (req as AuthRequest).userId
    const { examSetId, partNumber } = req.query

    // If no examSetId provided, return all sessions
    if (!examSetId || typeof examSetId !== 'string') {
      const sessions = await this.service.getAllUserSessions(userId)
      res.json({ success: true, data: sessions })
      return
    }

    const part = partNumber != null ? Number(partNumber) : null
    const sessions = await this.service.getUserSessionsBySet(userId, examSetId, part)
    res.json({ success: true, data: sessions })
  }

  async detail(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const userId = (req as AuthRequest).userId
    const id = req.params.id as string
    const session = await this.service.getSessionDetail(id, userId)
    res.json({ success: true, data: session })
  }

  async setStats(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const examSetId = req.params.examSetId as string
    const { partNumber } = req.query
    const part = partNumber != null ? Number(partNumber) : null
    const stats = await this.service.getSetStats(examSetId, part)
    res.json({ success: true, data: stats })
  }

  async completedSetIds(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const userId = (req as AuthRequest).userId
    const { partNumber } = req.query
    const part = partNumber != null ? Number(partNumber) : null
    const ids = await this.service.getCompletedSetIds(userId, part)
    res.json({ success: true, data: ids })
  }
}

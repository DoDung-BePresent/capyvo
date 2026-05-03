import type { Request, Response, NextFunction } from 'express'
import type { AuthRequest } from '@/middlewares/authenticate'
import { SessionService } from '@/services/session.service'
import { ValidationError } from '@/errors/app-error'

export class SessionController {
  private service = new SessionService()

  async create(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const userId = (req as AuthRequest).userId
    const { examSetId, partNumber } = req.body
    if (!examSetId) throw new ValidationError('examSetId is required')
    const part = partNumber != null ? Number(partNumber) : null
    const session = await this.service.createSession(userId, examSetId, part)
    res.status(201).json({ success: true, data: { sessionId: session.id } })
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
    if (!examSetId || typeof examSetId !== 'string')
      throw new ValidationError('examSetId query param is required')
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

import type { Request, Response, NextFunction } from 'express'
import type { AuthRequest } from '@/middlewares/authenticate'
import { sessionService } from '@/services/session.service'
import { ValidationError } from '@/errors/app-error'

export class SessionController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as AuthRequest).userId
      const { examSetId } = req.body
      if (!examSetId) throw new ValidationError('examSetId is required')
      const session = await sessionService.createSession(userId, examSetId)
      res.status(201).json({ success: true, data: { sessionId: session.id } })
    } catch (err) {
      next(err)
    }
  }

  async complete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as AuthRequest).userId
      const id = req.params.id as string
      await sessionService.completeSession(id, userId)
      res.json({ success: true })
    } catch (err) {
      next(err)
    }
  }

  async myBySet(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as AuthRequest).userId
      const { examSetId } = req.query
      if (!examSetId || typeof examSetId !== 'string')
        throw new ValidationError('examSetId query param is required')
      const sessions = await sessionService.getUserSessionsBySet(userId, examSetId)
      res.json({ success: true, data: sessions })
    } catch (err) {
      next(err)
    }
  }

  async detail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as AuthRequest).userId
      const id = req.params.id as string
      const session = await sessionService.getSessionDetail(id, userId)
      res.json({ success: true, data: session })
    } catch (err) {
      next(err)
    }
  }

  async setStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const examSetId = req.params.examSetId as string
      const stats = await sessionService.getSetStats(examSetId)
      res.json({ success: true, data: stats })
    } catch (err) {
      next(err)
    }
  }

  async completedSetIds(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as AuthRequest).userId
      const ids = await sessionService.getCompletedSetIds(userId)
      res.json({ success: true, data: ids })
    } catch (err) {
      next(err)
    }
  }
}

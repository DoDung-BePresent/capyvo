import type { Request, Response, NextFunction } from 'express'
import { ExamSetService } from '@/services/exam-set.service'
import type { AuthRequest } from '@/middlewares/authenticate'

export class ExamSetController {
  private service = new ExamSetService()

  async getAll(_req: Request, res: Response, _next: NextFunction): Promise<void> {
    const examSets = await this.service.findAll()
    res.json({ success: true, data: examSets })
  }

  async getById(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const examSet = await this.service.findById(req.params['id'] as string)
    res.json({ success: true, data: examSet })
  }

  async create(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const userId = (req as AuthRequest).userId
    const examSet = await this.service.create(req.body, userId)
    res.status(201).json({ success: true, data: examSet })
  }

  async update(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const examSet = await this.service.update(req.params['id'] as string, req.body)
    res.json({ success: true, data: examSet })
  }

  async remove(req: Request, res: Response, _next: NextFunction): Promise<void> {
    await this.service.remove(req.params['id'] as string)
    res.status(204).send()
  }

  async assignQuestion(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const question = await this.service.assignQuestion(
      req.params['id'] as string,
      req.body.questionId as string,
    )
    res.json({ success: true, data: question })
  }

  async unassignQuestion(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const question = await this.service.unassignQuestion(
      req.params['id'] as string,
      req.body.questionId as string,
    )
    res.json({ success: true, data: question })
  }

  async getPoolQuestions(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const questionNumber = Number(req.query['questionNumber'])
    const search = req.query['search'] as string | undefined
    const assignmentStatus = req.query['assignmentStatus'] as
      | 'all'
      | 'assigned'
      | 'unassigned'
      | undefined

    if (!questionNumber || questionNumber < 1 || questionNumber > 11) {
      res.status(400).json({ success: false, message: 'questionNumber must be 1–11' })
      return
    }

    const questions = await this.service.getPoolQuestions(questionNumber, search, assignmentStatus)
    res.json({ success: true, data: questions })
  }

  async getPublished(_req: Request, res: Response, _next: NextFunction): Promise<void> {
    const examSets = await this.service.findPublished()
    res.json({ success: true, data: examSets })
  }

  async getPublishedById(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const examSet = await this.service.findPublishedById(req.params['id'] as string)
    res.json({ success: true, data: examSet })
  }
}

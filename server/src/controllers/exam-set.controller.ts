import type { Request, Response, NextFunction } from 'express'
import { ExamSetService } from '@/services/exam-set.service'
import type { AuthRequest } from '@/middlewares/authenticate'

const examSetService = new ExamSetService()

export class ExamSetController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const examSets = await examSetService.findAll()
      res.json({ success: true, data: examSets })
    } catch (err) {
      next(err)
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const examSet = await examSetService.findById(req.params['id'] as string)
      res.json({ success: true, data: examSet })
    } catch (err) {
      next(err)
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as AuthRequest).userId
      const examSet = await examSetService.create(req.body, userId)
      res.status(201).json({ success: true, data: examSet })
    } catch (err) {
      next(err)
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const examSet = await examSetService.update(req.params['id'] as string, req.body)
      res.json({ success: true, data: examSet })
    } catch (err) {
      next(err)
    }
  }

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await examSetService.remove(req.params['id'] as string)
      res.status(204).send()
    } catch (err) {
      next(err)
    }
  }

  async assignQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const question = await examSetService.assignQuestion(
        req.params['id'] as string,
        req.body.questionId as string,
      )
      res.json({ success: true, data: question })
    } catch (err) {
      next(err)
    }
  }

  async unassignQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const question = await examSetService.unassignQuestion(
        req.params['id'] as string,
        req.body.questionId as string,
      )
      res.json({ success: true, data: question })
    } catch (err) {
      next(err)
    }
  }

  async getPoolQuestions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const questionNumber = Number(req.query['questionNumber'])
      if (!questionNumber || questionNumber < 1 || questionNumber > 11) {
        res.status(400).json({ success: false, message: 'questionNumber must be 1–11' })
        return
      }
      const questions = await examSetService.getPoolQuestions(questionNumber)
      res.json({ success: true, data: questions })
    } catch (err) {
      next(err)
    }
  }
}

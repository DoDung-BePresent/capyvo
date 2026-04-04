import type { Request, Response, NextFunction } from 'express'
import { ExamSetService } from '@/services/exam-set.service'

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
      const examSet = await examSetService.create(req.body)
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
}

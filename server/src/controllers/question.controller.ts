import type { Request, Response, NextFunction } from 'express'
import multer from 'multer'
import { QuestionService } from '@/services/question.service'
import { NotFoundError } from '@/errors/app-error'

const questionService = new QuestionService()

// Multer — store in memory, max 5MB for image uploads
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are allowed'))
      return
    }
    cb(null, true)
  },
})

// Multer — audio uploads, max 20MB
export const uploadAudio = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('audio/')) {
      cb(new Error('Only audio files are allowed'))
      return
    }
    cb(null, true)
  },
})

export class QuestionController {
  async uploadImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) throw new Error('No file uploaded')
      const url = await questionService.uploadImage(req.file.buffer, req.file.originalname)
      res.json({ success: true, data: { url } })
    } catch (err) {
      next(err)
    }
  }

  async analyzeImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { imageUrl } = req.body as { imageUrl?: string }
      if (!imageUrl) throw new Error('imageUrl is required')
      const context = await questionService.analyzeImage(imageUrl)
      res.json({ success: true, data: { context } })
    } catch (err) {
      next(err)
    }
  }

  async uploadAudio(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) throw new Error('No file uploaded')
      const url = await questionService.uploadAudio(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
      )
      res.json({ success: true, data: { url } })
    } catch (err) {
      next(err)
    }
  }

  async createPart1(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const question = await questionService.createPart1(req.body)
      res.status(201).json({ success: true, data: question })
    } catch (err) {
      next(err)
    }
  }

  async createPart2(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const question = await questionService.createPart2(req.body)
      res.status(201).json({ success: true, data: question })
    } catch (err) {
      next(err)
    }
  }

  async createPart3(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const questions = await questionService.createPart3(req.body)
      res.status(201).json({ success: true, data: questions })
    } catch (err) {
      next(err)
    }
  }

  async createPart4(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const questions = await questionService.createPart4(req.body)
      res.status(201).json({ success: true, data: questions })
    } catch (err) {
      next(err)
    }
  }

  async createPart5(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const question = await questionService.createPart5(req.body)
      res.status(201).json({ success: true, data: question })
    } catch (err) {
      next(err)
    }
  }

  async getQuestions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const partNumber = Number(req.query['partNumber'])
      const examSetId = req.query['examSetId'] as string | undefined
      if (!partNumber || partNumber < 1 || partNumber > 5) {
        res.status(400).json({ success: false, message: 'partNumber must be 1–5' })
        return
      }
      const questions = await questionService.getQuestions(partNumber, examSetId)
      res.json({ success: true, data: questions })
    } catch (err) {
      next(err)
    }
  }

  async updateQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params['id'] as string
      const question = await questionService.updateQuestion(id, req.body)
      res.json({ success: true, data: question })
    } catch (err) {
      if ((err as { code?: string }).code === 'P2025') {
        next(new NotFoundError('Question'))
      } else {
        next(err)
      }
    }
  }

  async deleteQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params['id'] as string
      await questionService.deleteQuestion(id)
      res.json({ success: true, data: null })
    } catch (err) {
      if ((err as { code?: string }).code === 'P2025') {
        next(new NotFoundError('Question'))
      } else {
        next(err)
      }
    }
  }

  async getPracticeSets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const partNumber = Number(req.query['partNumber'])
      if (!partNumber || partNumber < 1 || partNumber > 5) {
        res.status(400).json({ success: false, message: 'partNumber must be 1–5' })
        return
      }
      const sets = await questionService.getPracticeSets(partNumber)
      res.json({ success: true, data: sets })
    } catch (err) {
      next(err)
    }
  }

  /**
   * GET /api/questions/part/:partNumber/all
   * Lấy tất cả câu hỏi của một part (flat list)
   */
  async getQuestionsByPart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const partNumber = Number(req.params['partNumber'])
      if (!partNumber || partNumber < 1 || partNumber > 5) {
        res.status(400).json({ success: false, message: 'partNumber must be 1–5' })
        return
      }
      const questions = await questionService.getQuestionsByPart(partNumber)
      res.json({ success: true, data: questions })
    } catch (err) {
      next(err)
    }
  }

  /**
   * GET /api/questions/part/:partNumber/exam-sets
   * Lấy danh sách exam sets của một part
   */
  async getExamSetsByPart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const partNumber = Number(req.params['partNumber'])
      if (!partNumber || partNumber < 1 || partNumber > 5) {
        res.status(400).json({ success: false, message: 'partNumber must be 1–5' })
        return
      }
      const examSets = await questionService.getExamSetsByPart(partNumber)
      res.json({ success: true, data: examSets })
    } catch (err) {
      next(err)
    }
  }
}

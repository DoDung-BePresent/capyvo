import type { Request, Response, NextFunction } from 'express'
import multer from 'multer'
import { QuestionService } from '@/services/question.service'
import { NotFoundError } from '@/errors/app-error'

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
  private service = new QuestionService()

  async uploadImage(req: Request, res: Response, _next: NextFunction): Promise<void> {
    if (!req.file) throw new Error('No file uploaded')
    const url = await this.service.uploadImage(req.file.buffer, req.file.originalname)
    res.json({ success: true, data: { url } })
  }

  async analyzeImage(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const { imageUrl } = req.body as { imageUrl?: string }
    if (!imageUrl) throw new Error('imageUrl is required')
    const context = await this.service.analyzeImage(imageUrl)
    res.json({ success: true, data: { context } })
  }

  async uploadAudio(req: Request, res: Response, _next: NextFunction): Promise<void> {
    if (!req.file) throw new Error('No file uploaded')
    const url = await this.service.uploadAudio(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
    )
    res.json({ success: true, data: { url } })
  }

  async createPart1(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const question = await this.service.createPart1(req.body)
    res.status(201).json({ success: true, data: question })
  }

  async createPart2(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const question = await this.service.createPart2(req.body)
    res.status(201).json({ success: true, data: question })
  }

  async createPart3(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const questions = await this.service.createPart3(req.body)
    res.status(201).json({ success: true, data: questions })
  }

  async createPart4(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const questions = await this.service.createPart4(req.body)
    res.status(201).json({ success: true, data: questions })
  }

  async createPart5(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const question = await this.service.createPart5(req.body)
    res.status(201).json({ success: true, data: question })
  }

  async getQuestions(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const partNumber = Number(req.query['partNumber'])
    const examSetId = req.query['examSetId'] as string | undefined
    if (!partNumber || partNumber < 1 || partNumber > 5) {
      res.status(400).json({ success: false, message: 'partNumber must be 1–5' })
      return
    }
    const questions = await this.service.getQuestions(partNumber, examSetId)
    res.json({ success: true, data: questions })
  }

  async updateQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params['id'] as string
      const question = await this.service.updateQuestion(id, req.body)
      res.json({ success: true, data: question })
    } catch (err) {
      if ((err as { code?: string }).code === 'P2025') {
        next(new NotFoundError('Question'))
      } else {
        throw err
      }
    }
  }

  async deleteQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params['id'] as string
      await this.service.deleteQuestion(id)
      res.json({ success: true, data: null })
    } catch (err) {
      if ((err as { code?: string }).code === 'P2025') {
        next(new NotFoundError('Question'))
      } else {
        throw err
      }
    }
  }

  async getPracticeSets(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const partNumber = Number(req.query['partNumber'])
    if (!partNumber || partNumber < 1 || partNumber > 5) {
      res.status(400).json({ success: false, message: 'partNumber must be 1–5' })
      return
    }
    const sets = await this.service.getPracticeSets(partNumber)
    res.json({ success: true, data: sets })
  }

  async getQuestionsByPart(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const partNumber = Number(req.params['partNumber'])
    if (!partNumber || partNumber < 1 || partNumber > 5) {
      res.status(400).json({ success: false, message: 'partNumber must be 1–5' })
      return
    }
    const questions = await this.service.getQuestionsByPart(partNumber)
    res.json({ success: true, data: questions })
  }

  async getExamSetsByPart(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const partNumber = Number(req.params['partNumber'])
    if (!partNumber || partNumber < 1 || partNumber > 5) {
      res.status(400).json({ success: false, message: 'partNumber must be 1–5' })
      return
    }
    const examSets = await this.service.getExamSetsByPart(partNumber)
    res.json({ success: true, data: examSets })
  }
}

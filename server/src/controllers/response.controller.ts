import type { Request, Response, NextFunction } from 'express'
import multer from 'multer'
import { ResponseService } from '@/services/response.service'
import { ValidationError } from '@/errors/app-error'
import type { AuthRequest } from '@/middlewares/authenticate'

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

export class ResponseController {
  private service = new ResponseService()

  async checkSubscription(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const userId = (req as AuthRequest).userId
    const result = await this.service.checkUserSubscription(userId)
    res.json({ success: true, data: result })
  }

  async saveAudio(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const { questionId, sessionId } = req.body
    const file = req.file
    if (!file) throw new ValidationError('audio file is required')
    if (!questionId) throw new ValidationError('questionId is required')
    if (!sessionId) throw new ValidationError('sessionId is required')

    const result = await this.service.saveAudio(sessionId, questionId, file.buffer, file.mimetype)
    res.status(201).json({ success: true, data: result })
  }

  async transcribe(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const id = req.params['id'] as string
    const userId = (req as AuthRequest).userId
    const transcript = await this.service.transcribeResponse(id, userId)
    res.json({ success: true, data: { transcript } })
  }

  async analyze(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const id = req.params['id'] as string
    const userId = (req as AuthRequest).userId
    const { partNumber } = req.body
    if (!partNumber) throw new ValidationError('partNumber is required')
    const analysis = await this.service.analyzeResponse(id, userId, partNumber)
    res.json({ success: true, data: { analysis } })
  }

  async transcribeAndAnalyze(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const id = req.params['id'] as string
    const userId = (req as AuthRequest).userId
    const { partNumber } = req.body
    if (!partNumber) throw new ValidationError('partNumber is required')
    const result = await this.service.transcribeAndAnalyze(id, userId, partNumber)
    res.json({ success: true, data: result })
  }

  async getQuestionHistory(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const questionId = req.params['questionId'] as string
    const userId = (req as AuthRequest).userId
    const history = await this.service.getQuestionHistory(questionId, userId)
    res.json({ success: true, data: history })
  }
}

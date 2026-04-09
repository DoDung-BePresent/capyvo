import type { Request, Response, NextFunction } from 'express'
import multer from 'multer'
import { responseService } from '@/services/response.service'
import { ValidationError } from '@/errors/app-error'

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
  async saveAudio(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { questionId } = req.body
      const file = req.file
      if (!file) throw new ValidationError('audio file is required')
      if (!questionId) throw new ValidationError('questionId is required')

      const audioUrl = await responseService.saveAudio(questionId, file.buffer, file.mimetype)
      res.status(201).json({ success: true, data: { audioUrl } })
    } catch (err) {
      next(err)
    }
  }
}

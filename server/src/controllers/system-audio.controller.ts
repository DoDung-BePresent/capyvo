import type { Request, Response, NextFunction } from 'express'
import multer from 'multer'
import { SystemAudioService } from '@/services/system-audio.service'
import { ValidationError } from '@/errors/app-error'

const service = new SystemAudioService()

export const audioUpload = multer({
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

export class SystemAudioController {
  async getAll(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const items = await service.findAll()
      res.json({ success: true, data: items })
    } catch (err) {
      next(err)
    }
  }

  async uploadAudio(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const key = req.params['key'] as string
      if (!req.file) throw new ValidationError('No audio file uploaded')
      const item = await service.uploadAudio(key, req.file.buffer, req.file.originalname)
      res.json({ success: true, data: item })
    } catch (err) {
      next(err)
    }
  }
}

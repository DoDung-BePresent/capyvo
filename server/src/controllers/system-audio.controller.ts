import type { Request, Response, NextFunction } from 'express'
import multer from 'multer'
import { SystemAudioService } from '@/services/system-audio.service'
import { ValidationError } from '@/errors/app-error'

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
  private service = new SystemAudioService()

  async getAll(_req: Request, res: Response, _next: NextFunction): Promise<void> {
    const items = await this.service.findAll()
    res.json({ success: true, data: items })
  }

  async uploadAudio(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const key = req.params['key'] as string
    if (!req.file) throw new ValidationError('No audio file uploaded')
    const item = await this.service.uploadAudio(key, req.file.buffer, req.file.originalname)
    res.json({ success: true, data: item })
  }
}

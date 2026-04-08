import type { Request, Response, NextFunction } from 'express'
import multer from 'multer'
import { PartInstructionService } from '@/services/part-instruction.service'
import { ValidationError } from '@/errors/app-error'

const service = new PartInstructionService()

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

export class PartInstructionController {
  async getAll(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instructions = await service.findAll()
      res.json({ success: true, data: instructions })
    } catch (err) {
      next(err)
    }
  }

  async uploadAudio(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const partNumber = Number(req.params['partNumber'])
      if (!req.file) throw new ValidationError('No audio file uploaded')
      const instruction = await service.uploadAudio(
        partNumber,
        req.file.buffer,
        req.file.originalname,
      )
      res.json({ success: true, data: instruction })
    } catch (err) {
      next(err)
    }
  }
}

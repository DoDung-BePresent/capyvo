import type { Request, Response, NextFunction } from 'express'
import multer from 'multer'
import { PartInstructionService } from '@/services/part-instruction.service'
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

export class PartInstructionController {
  private service = new PartInstructionService()

  async getAll(_req: Request, res: Response, _next: NextFunction): Promise<void> {
    const instructions = await this.service.findAll()
    res.json({ success: true, data: instructions })
  }

  async uploadAudio(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const partNumber = Number(req.params['partNumber'])
    if (!req.file) throw new ValidationError('No audio file uploaded')
    const instruction = await this.service.uploadAudio(
      partNumber,
      req.file.buffer,
      req.file.originalname,
    )
    res.json({ success: true, data: instruction })
  }
}

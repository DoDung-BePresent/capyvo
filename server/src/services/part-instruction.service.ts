import { z } from 'zod'
import prisma from '@/lib/prisma'
import supabaseAdmin from '@/lib/supabase'
import { ValidationError } from '@/errors/app-error'

export const PartNumberSchema = z.number().int().min(1).max(5)

export class PartInstructionService {
  async findAll() {
    return prisma.partInstruction.findMany({ orderBy: { partNumber: 'asc' } })
  }

  async uploadAudio(partNumber: number, buffer: Buffer, originalname: string) {
    const parsed = PartNumberSchema.safeParse(partNumber)
    if (!parsed.success) throw new ValidationError('partNumber must be 1–5')

    const ext = originalname.split('.').pop() ?? 'mp3'
    const storagePath = `instructions/part${partNumber}/${Date.now()}.${ext}`

    const { error } = await supabaseAdmin.storage
      .from('audio')
      .upload(storagePath, buffer, { contentType: 'audio/mpeg', upsert: true })

    if (error) throw new Error(`Storage upload failed: ${error.message}`)

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from('audio').getPublicUrl(storagePath)

    return prisma.partInstruction.upsert({
      where: { partNumber },
      create: { partNumber, audioUrl: publicUrl },
      update: { audioUrl: publicUrl },
    })
  }
}

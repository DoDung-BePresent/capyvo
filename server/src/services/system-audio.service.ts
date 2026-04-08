import { z } from 'zod'
import prisma from '@/lib/prisma'
import supabaseAdmin from '@/lib/supabase'
import { ValidationError } from '@/errors/app-error'

export const SYSTEM_AUDIO_KEYS = ['START_SPEAKING', 'START_RESPONSE'] as const
export type SystemAudioKey = (typeof SYSTEM_AUDIO_KEYS)[number]

const KeySchema = z.enum(SYSTEM_AUDIO_KEYS)

export class SystemAudioService {
  async findAll() {
    return prisma.systemAudio.findMany({ orderBy: { key: 'asc' } })
  }

  async uploadAudio(key: string, buffer: Buffer, originalname: string) {
    const parsed = KeySchema.safeParse(key)
    if (!parsed.success)
      throw new ValidationError(`key must be one of: ${SYSTEM_AUDIO_KEYS.join(', ')}`)

    const ext = originalname.split('.').pop() ?? 'mp3'
    const storagePath = `signals/${key.toLowerCase()}/${Date.now()}.${ext}`

    const { error } = await supabaseAdmin.storage
      .from('audio')
      .upload(storagePath, buffer, { contentType: 'audio/mpeg', upsert: true })

    if (error) throw new Error(`Storage upload failed: ${error.message}`)

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from('audio').getPublicUrl(storagePath)

    return prisma.systemAudio.upsert({
      where: { key },
      create: { key, audioUrl: publicUrl },
      update: { audioUrl: publicUrl },
    })
  }
}

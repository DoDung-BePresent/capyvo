import supabaseAdmin from '@/lib/supabase'
import prisma from '@/lib/prisma'

class ResponseService {
  async saveAudio(
    sessionId: string,
    questionId: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<string> {
    const ext = mimeType.includes('ogg') ? 'ogg' : mimeType.includes('mp4') ? 'mp4' : 'webm'
    const filename = `${Date.now()}-${questionId}.${ext}`
    const storagePath = `responses/${filename}`

    const { error } = await supabaseAdmin.storage
      .from('audio')
      .upload(storagePath, buffer, { contentType: mimeType, upsert: false })

    if (error) throw new Error(`Storage upload failed: ${error.message}`)

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from('audio').getPublicUrl(storagePath)

    await prisma.userResponse.upsert({
      where: { sessionId_questionId: { sessionId, questionId } },
      create: { sessionId, questionId, audioUrl: publicUrl },
      update: { audioUrl: publicUrl },
    })

    return publicUrl
  }
}

export const responseService = new ResponseService()

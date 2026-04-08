import OpenAI from 'openai'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import supabaseAdmin from '@/lib/supabase'
import { ValidationError } from '@/errors/app-error'

// ─── Zod schemas ──────────────────────────────────────────────────────────────

export const CreatePart1Schema = z.object({
  questionNumber: z.union([z.literal(1), z.literal(2)]),
  contentText: z.string().min(1),
})

export const CreatePart2Schema = z.object({
  questionNumber: z.union([z.literal(3), z.literal(4)]),
  imageUrl: z.string().url(),
})

export const CreatePart3Schema = z.object({
  contextText: z.string().min(1),
  questions: z
    .array(
      z.object({
        questionNumber: z.union([z.literal(5), z.literal(6), z.literal(7)]),
        questionText: z.string().min(1),
      }),
    )
    .length(3),
})

export const CreatePart4Schema = z.object({
  contextText: z.string().min(1),
  imageUrl: z.string().url(),
  questions: z
    .array(
      z.object({
        questionNumber: z.union([z.literal(8), z.literal(9), z.literal(10)]),
        questionText: z.string().min(1),
      }),
    )
    .length(3),
})

export const CreatePart5Schema = z.object({
  questionText: z.string().min(1),
})

// ─── Types ────────────────────────────────────────────────────────────────────

export type CreatePart1Dto = z.infer<typeof CreatePart1Schema>
export type CreatePart2Dto = z.infer<typeof CreatePart2Schema>
export type CreatePart3Dto = z.infer<typeof CreatePart3Schema>
export type CreatePart4Dto = z.infer<typeof CreatePart4Schema>
export type CreatePart5Dto = z.infer<typeof CreatePart5Schema>

// ─── Helpers ──────────────────────────────────────────────────────────────────

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

async function generateAndUploadTTS(text: string, prefix: string): Promise<string> {
  const mp3 = await openai.audio.speech.create({
    model: 'tts-1',
    voice: 'nova',
    input: text,
  })

  const arrayBuffer = await mp3.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const filename = `${prefix}-${Date.now()}.mp3`
  const storagePath = `questions/${filename}`

  const { error } = await supabaseAdmin.storage
    .from('audio')
    .upload(storagePath, buffer, { contentType: 'audio/mpeg', upsert: false })

  if (error) throw new Error(`Storage upload failed: ${error.message}`)

  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from('audio').getPublicUrl(storagePath)

  return publicUrl
}

function getQuestionTiming(
  partNumber: number,
  questionNumber: number,
): { prepTimeSeconds: number; responseTimeSeconds: number } {
  switch (partNumber) {
    case 1:
      return { prepTimeSeconds: 45, responseTimeSeconds: 45 }
    case 2:
      return { prepTimeSeconds: 45, responseTimeSeconds: 30 }
    case 3:
      return { prepTimeSeconds: 3, responseTimeSeconds: questionNumber === 7 ? 30 : 15 }
    case 4:
      return { prepTimeSeconds: 3, responseTimeSeconds: questionNumber === 10 ? 30 : 15 }
    case 5:
      return { prepTimeSeconds: 45, responseTimeSeconds: 60 }
    default:
      throw new ValidationError(`Invalid part number: ${partNumber}`)
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class QuestionService {
  async createPart1(body: unknown) {
    const dto = CreatePart1Schema.parse(body)
    const timing = getQuestionTiming(1, dto.questionNumber)

    return prisma.question.create({
      data: {
        partNumber: 1,
        questionNumber: dto.questionNumber,
        contentText: dto.contentText,
        ...timing,
      },
    })
  }

  async createPart2(body: unknown) {
    const dto = CreatePart2Schema.parse(body)
    const timing = getQuestionTiming(2, dto.questionNumber)

    return prisma.question.create({
      data: {
        partNumber: 2,
        questionNumber: dto.questionNumber,
        imageUrls: [dto.imageUrl],
        ...timing,
      },
    })
  }

  async createPart3(body: unknown) {
    const dto = CreatePart3Schema.parse(body)

    const contextAudioUrl = await generateAndUploadTTS(dto.contextText, 'context')

    const questions = await Promise.all(
      dto.questions.map(async (q) => {
        const questionAudioUrl = await generateAndUploadTTS(q.questionText, `q${q.questionNumber}`)
        const timing = getQuestionTiming(3, q.questionNumber)
        return prisma.question.create({
          data: {
            partNumber: 3,
            questionNumber: q.questionNumber,
            contextText: dto.contextText,
            contextAudioUrl,
            questionText: q.questionText,
            questionAudioUrl,
            ...timing,
          },
        })
      }),
    )

    return questions
  }

  async createPart4(body: unknown) {
    const dto = CreatePart4Schema.parse(body)

    const contextAudioUrl = await generateAndUploadTTS(dto.contextText, 'context-p4')

    const questions = await Promise.all(
      dto.questions.map(async (q) => {
        const questionAudioUrl = await generateAndUploadTTS(q.questionText, `q${q.questionNumber}`)
        const timing = getQuestionTiming(4, q.questionNumber)
        return prisma.question.create({
          data: {
            partNumber: 4,
            questionNumber: q.questionNumber,
            contextText: dto.contextText,
            contextAudioUrl,
            imageUrls: [dto.imageUrl],
            questionText: q.questionText,
            questionAudioUrl,
            ...timing,
          },
        })
      }),
    )

    return questions
  }

  async createPart5(body: unknown) {
    const dto = CreatePart5Schema.parse(body)
    const timing = getQuestionTiming(5, 11)

    const questionAudioUrl = await generateAndUploadTTS(dto.questionText, 'q11')

    return prisma.question.create({
      data: {
        partNumber: 5,
        questionNumber: 11,
        questionText: dto.questionText,
        questionAudioUrl,
        ...timing,
      },
    })
  }

  async getQuestions(partNumber: number) {
    return prisma.question.findMany({
      where: { partNumber },
      orderBy: [{ questionNumber: 'asc' }, { createdAt: 'desc' }],
    })
  }

  async deleteQuestion(id: string) {
    return prisma.question.delete({ where: { id } })
  }

  async uploadImage(buffer: Buffer, originalName: string): Promise<string> {
    const filename = `${Date.now()}-${originalName.replace(/\s+/g, '_')}`
    const storagePath = `questions/${filename}`

    const { error } = await supabaseAdmin.storage
      .from('images')
      .upload(storagePath, buffer, { contentType: 'image/jpeg', upsert: false })

    if (error) throw new Error(`Storage upload failed: ${error.message}`)

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from('images').getPublicUrl(storagePath)

    return publicUrl
  }
}

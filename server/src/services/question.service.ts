import OpenAI from 'openai'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import supabaseAdmin from '@/lib/supabase'
import { ValidationError } from '@/errors/app-error'
import { optimizeImage, compressAudio } from '@/lib/media'

// ─── Zod schemas ──────────────────────────────────────────────────────────────

export const CreatePart1Schema = z.object({
  questionNumber: z.union([z.literal(1), z.literal(2)]),
  contentText: z.string().min(1),
})

export const CreatePart2Schema = z.object({
  questionNumber: z.union([z.literal(3), z.literal(4)]),
  imageUrl: z.string().url(),
  imageContext: z.string().optional(),
})

export const CreatePart3Schema = z.object({
  contextText: z.string().min(1),
  contextAudioUrl: z.string().url().optional(),
  questions: z
    .array(
      z.object({
        questionNumber: z.union([z.literal(5), z.literal(6), z.literal(7)]),
        questionText: z.string().min(1),
        questionAudioUrl: z.string().url().optional(),
      }),
    )
    .length(3),
})

export const CreatePart4Schema = z.object({
  contextText: z.string().min(1),
  contextAudioUrl: z.string().url().optional(),
  imageUrl: z.string().url(),
  imageContext: z.string().optional(),
  questions: z
    .array(
      z.object({
        questionNumber: z.union([z.literal(8), z.literal(9), z.literal(10)]),
        questionText: z.string().min(1),
        questionAudioUrl: z.string().url().optional(),
      }),
    )
    .length(3),
})

export const CreatePart5Schema = z.object({
  questionText: z.string().min(1),
  questionAudioUrl: z.string().url().optional(),
})

// ─── Types ────────────────────────────────────────────────────────────────────

export type CreatePart1Dto = z.infer<typeof CreatePart1Schema>
export type CreatePart2Dto = z.infer<typeof CreatePart2Schema>
export type CreatePart3Dto = z.infer<typeof CreatePart3Schema>
export type CreatePart4Dto = z.infer<typeof CreatePart4Schema>
export type CreatePart5Dto = z.infer<typeof CreatePart5Schema>

export const UpdateQuestionSchema = z.object({
  contentText: z.string().min(1).optional(),
  contextText: z.string().min(1).optional(),
  contextAudioUrl: z.string().url().nullable().optional(),
  questionText: z.string().min(1).optional(),
  questionAudioUrl: z.string().url().nullable().optional(),
  imageUrls: z.array(z.string().url()).optional(),
  imageContext: z.string().nullable().optional(),
})

export type UpdateQuestionDto = z.infer<typeof UpdateQuestionSchema>

// ─── Helpers ──────────────────────────────────────────────────────────────────

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

async function generateAndUploadTTS(text: string, prefix: string): Promise<string> {
  const mp3 = await openai.audio.speech.create({
    model: 'tts-1-hd',
    voice: 'onyx',
    input: text,
    speed: 0.9,
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

function extractStoragePath(publicUrl: string, bucket: 'audio' | 'images'): string {
  const marker = `/object/public/${bucket}/`
  const idx = publicUrl.indexOf(marker)
  if (idx === -1) return publicUrl
  return publicUrl.slice(idx + marker.length)
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
        imageContext: dto.imageContext,
        ...timing,
      },
    })
  }

  async createPart3(body: unknown) {
    const dto = CreatePart3Schema.parse(body)

    const contextAudioUrl =
      dto.contextAudioUrl ?? (await generateAndUploadTTS(dto.contextText, 'context'))

    const questions = await Promise.all(
      dto.questions.map(async (q) => {
        const questionAudioUrl =
          q.questionAudioUrl ?? (await generateAndUploadTTS(q.questionText, `q${q.questionNumber}`))
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

    const contextAudioUrl =
      dto.contextAudioUrl ?? (await generateAndUploadTTS(dto.contextText, 'context-p4'))

    const questions = await Promise.all(
      dto.questions.map(async (q) => {
        const questionAudioUrl =
          q.questionAudioUrl ?? (await generateAndUploadTTS(q.questionText, `q${q.questionNumber}`))
        const timing = getQuestionTiming(4, q.questionNumber)
        return prisma.question.create({
          data: {
            partNumber: 4,
            questionNumber: q.questionNumber,
            contextText: dto.contextText,
            contextAudioUrl,
            imageUrls: [dto.imageUrl],
            imageContext: dto.imageContext,
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

    const questionAudioUrl =
      dto.questionAudioUrl ?? (await generateAndUploadTTS(dto.questionText, 'q11'))

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

  async getQuestions(partNumber: number, examSetId?: string) {
    return prisma.question.findMany({
      where: { partNumber, ...(examSetId ? { examSetId } : {}) },
      orderBy: [{ questionNumber: 'asc' }, { createdAt: 'desc' }],
    })
  }

  // Returns each published exam set that has questions for this partNumber,
  // along with those questions — one card per exam set on the practice page.
  async getPracticeSets(partNumber: number) {
    const questions = await prisma.question.findMany({
      where: {
        partNumber,
        examSetId: { not: null },
        examSet: { isPublished: true },
      },
      include: { examSet: { select: { id: true, title: true } } },
      orderBy: { questionNumber: 'asc' },
    })

    const groups = new Map<
      string,
      { examSetId: string; examSetTitle: string; questions: typeof questions }
    >()
    for (const q of questions) {
      if (!q.examSetId || !q.examSet) continue
      if (!groups.has(q.examSetId)) {
        groups.set(q.examSetId, {
          examSetId: q.examSetId,
          examSetTitle: q.examSet.title,
          questions: [],
        })
      }
      groups.get(q.examSetId)!.questions.push(q)
    }
    return Array.from(groups.values())
  }

  async deleteQuestion(id: string) {
    return prisma.question.delete({ where: { id } })
  }

  async uploadAudio(buffer: Buffer, originalName: string, mimeType: string): Promise<string> {
    const compressed = await compressAudio(buffer, mimeType)
    const baseName = originalName.replace(/\.[^.]+$/, '').replace(/\s+/g, '_')
    const filename = `${Date.now()}-${baseName}.mp3`
    const storagePath = `questions/${filename}`

    const { error } = await supabaseAdmin.storage
      .from('audio')
      .upload(storagePath, compressed, { contentType: 'audio/mpeg', upsert: false })

    if (error) throw new Error(`Storage upload failed: ${error.message}`)

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from('audio').getPublicUrl(storagePath)

    return publicUrl
  }

  async uploadImage(buffer: Buffer, originalName: string): Promise<string> {
    const { data: optimized, contentType, ext } = await optimizeImage(buffer)
    const baseName = originalName.replace(/\.[^.]+$/, '').replace(/\s+/g, '_')
    const filename = `${Date.now()}-${baseName}.${ext}`
    const storagePath = `questions/${filename}`

    const { error } = await supabaseAdmin.storage
      .from('images')
      .upload(storagePath, optimized, { contentType, upsert: false })

    if (error) throw new Error(`Storage upload failed: ${error.message}`)

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from('images').getPublicUrl(storagePath)

    return publicUrl
  }

  async updateQuestion(id: string, body: unknown) {
    const dto = UpdateQuestionSchema.parse(body)

    const current = await prisma.question.findUniqueOrThrow({ where: { id } })

    // Remove stale audio files from storage when URLs change
    const staleAudio: string[] = []
    if ('contextAudioUrl' in dto && dto.contextAudioUrl !== current.contextAudioUrl) {
      if (current.contextAudioUrl)
        staleAudio.push(extractStoragePath(current.contextAudioUrl, 'audio'))
    }
    if ('questionAudioUrl' in dto && dto.questionAudioUrl !== current.questionAudioUrl) {
      if (current.questionAudioUrl)
        staleAudio.push(extractStoragePath(current.questionAudioUrl, 'audio'))
    }
    if (staleAudio.length) {
      await supabaseAdmin.storage.from('audio').remove(staleAudio)
    }

    // Remove stale images from storage when imageUrls change
    if (dto.imageUrls) {
      const newSet = new Set(dto.imageUrls)
      const removed = current.imageUrls.filter((url) => !newSet.has(url))
      if (removed.length) {
        await supabaseAdmin.storage
          .from('images')
          .remove(removed.map((url) => extractStoragePath(url, 'images')))
      }
    }

    return prisma.question.update({ where: { id }, data: dto })
  }

  async analyzeImage(imageUrl: string): Promise<string> {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: "Describe the key content of this image in English for a TOEIC speaking exam. Be specific and factual: mention people, objects, setting, actions, numbers, labels, or data visible. Keep it under 100 words. This description will be used as context for evaluating a student's spoken response about the image.",
            },
            {
              type: 'image_url',
              image_url: { url: imageUrl, detail: 'high' },
            },
          ],
        },
      ],
      max_tokens: 200,
    })

    return response.choices[0]?.message?.content?.trim() ?? ''
  }

  /**
   * Lấy tất cả câu hỏi của một part (flat list với examSetId)
   * Tối ưu cho UI grid questions
   */
  async getQuestionsByPart(partNumber: number) {
    const questions = await prisma.question.findMany({
      where: {
        partNumber,
        examSetId: { not: null },
        examSet: { isPublished: true },
      },
      include: {
        examSet: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: [{ examSetId: 'asc' }, { questionNumber: 'asc' }],
    })

    return questions.map((q) => ({
      ...q,
      examSetId: q.examSet?.id ?? '',
      examSetTitle: q.examSet?.title ?? '',
      examSet: undefined, // Remove nested object
    }))
  }

  /**
   * Lấy danh sách exam sets của một part (cho filter sidebar)
   */
  async getExamSetsByPart(partNumber: number) {
    const examSets = await prisma.examSet.findMany({
      where: {
        isPublished: true,
        questions: {
          some: {
            partNumber,
          },
        },
      },
      select: {
        id: true,
        title: true,
        _count: {
          select: {
            questions: {
              where: {
                partNumber,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return examSets.map((set) => ({
      id: set.id,
      title: set.title,
      questionCount: set._count.questions,
    }))
  }
}

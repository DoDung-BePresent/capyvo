import OpenAI from 'openai'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import supabaseAdmin from '@/lib/supabase'
import { ValidationError } from '@/errors/app-error'
import { optimizeImage, compressAudio } from '@/lib/media'
import { Prisma } from '@prisma/client'

// ─── Zod schemas ──────────────────────────────────────────────────────────────

export const CreatePart1Schema = z.object({
  questionNumber: z.union([z.literal(1), z.literal(2)]),
  contentText: z.string().min(1),
  type: z.enum(['PRACTICE', 'FORECAST', 'CUSTOM']).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  topicIds: z.array(z.string()).optional(),
})

export const CreatePart2Schema = z.object({
  questionNumber: z.union([z.literal(3), z.literal(4)]),
  imageUrl: z.string().url(),
  imageContext: z.string().optional(),
  type: z.enum(['PRACTICE', 'FORECAST', 'CUSTOM']).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  topicIds: z.array(z.string()).optional(),
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
  type: z.enum(['PRACTICE', 'FORECAST', 'CUSTOM']).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  topicIds: z.array(z.string()).optional(),
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
  type: z.enum(['PRACTICE', 'FORECAST', 'CUSTOM']).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  topicIds: z.array(z.string()).optional(),
})

export const CreatePart5Schema = z.object({
  questionText: z.string().min(1),
  questionAudioUrl: z.string().url().optional(),
  type: z.enum(['PRACTICE', 'FORECAST', 'CUSTOM']).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  topicIds: z.array(z.string()).optional(),
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

/**
 * Validate question data
 * Validates: Requirements 1.3, 1.4, 5.1, 5.2
 */
function validateQuestionData(data: {
  type?: string
  status?: string
  contentText?: string
  questionText?: string
  contextText?: string
}) {
  // Validate type enum
  if (data.type && !['PRACTICE', 'FORECAST', 'CUSTOM'].includes(data.type)) {
    throw new ValidationError(
      `Invalid question type: ${data.type}. Must be PRACTICE, FORECAST, or CUSTOM`,
    )
  }

  // Validate status enum
  if (data.status && !['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(data.status)) {
    throw new ValidationError(
      `Invalid question status: ${data.status}. Must be DRAFT, PUBLISHED, or ARCHIVED`,
    )
  }

  // Validate non-empty content (at least one content field must be non-empty)
  const hasContent =
    (data.contentText && data.contentText.trim().length > 0) ||
    (data.questionText && data.questionText.trim().length > 0) ||
    (data.contextText && data.contextText.trim().length > 0)

  if (!hasContent) {
    throw new ValidationError(
      'Question must have at least one non-empty content field (contentText, questionText, or contextText)',
    )
  }
}

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
  /**
   * Create Part 1 question
   * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 5.1
   */
  async createPart1(body: unknown) {
    const dto = CreatePart1Schema.parse(body)

    // Validate question data
    validateQuestionData({
      type: dto.type,
      status: dto.status,
      contentText: dto.contentText,
    })

    const timing = getQuestionTiming(1, dto.questionNumber)

    const question = await prisma.question.create({
      data: {
        partNumber: 1,
        questionNumber: dto.questionNumber,
        contentText: dto.contentText,
        type: dto.type ?? 'PRACTICE',
        status: dto.status ?? 'DRAFT',
        ...timing,
      },
    })

    // Create topic assignments if provided
    if (dto.topicIds && dto.topicIds.length > 0) {
      await prisma.questionTopicAssignment.createMany({
        data: dto.topicIds.map((topicId) => ({
          questionId: question.id,
          topicId,
        })),
      })
    }

    return question
  }

  /**
   * Create Part 2 question
   * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 5.1
   */
  async createPart2(body: unknown) {
    const dto = CreatePart2Schema.parse(body)

    // Validate question data (Part 2 has imageContext as content)
    validateQuestionData({
      type: dto.type,
      status: dto.status,
      contentText: dto.imageContext || 'image', // Image URL serves as content
    })

    const timing = getQuestionTiming(2, dto.questionNumber)

    const question = await prisma.question.create({
      data: {
        partNumber: 2,
        questionNumber: dto.questionNumber,
        imageUrls: [dto.imageUrl],
        imageContext: dto.imageContext,
        type: dto.type ?? 'PRACTICE',
        status: dto.status ?? 'DRAFT',
        ...timing,
      },
    })

    // Create topic assignments if provided
    if (dto.topicIds && dto.topicIds.length > 0) {
      await prisma.questionTopicAssignment.createMany({
        data: dto.topicIds.map((topicId) => ({
          questionId: question.id,
          topicId,
        })),
      })
    }

    return question
  }

  /**
   * Create Part 3 questions (3 questions with shared context)
   * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 5.1
   */
  async createPart3(body: unknown) {
    const dto = CreatePart3Schema.parse(body)

    // Validate question data
    validateQuestionData({
      type: dto.type,
      status: dto.status,
      contextText: dto.contextText,
      questionText: dto.questions[0].questionText, // At least one question text
    })

    const contextAudioUrl =
      dto.contextAudioUrl ?? (await generateAndUploadTTS(dto.contextText, 'context'))

    const questions = await Promise.all(
      dto.questions.map(async (q) => {
        const questionAudioUrl =
          q.questionAudioUrl ?? (await generateAndUploadTTS(q.questionText, `q${q.questionNumber}`))
        const timing = getQuestionTiming(3, q.questionNumber)
        const question = await prisma.question.create({
          data: {
            partNumber: 3,
            questionNumber: q.questionNumber,
            contextText: dto.contextText,
            contextAudioUrl,
            questionText: q.questionText,
            questionAudioUrl,
            type: dto.type ?? 'PRACTICE',
            status: dto.status ?? 'DRAFT',
            ...timing,
          },
        })

        // Create topic assignments if provided
        if (dto.topicIds && dto.topicIds.length > 0) {
          await prisma.questionTopicAssignment.createMany({
            data: dto.topicIds.map((topicId) => ({
              questionId: question.id,
              topicId,
            })),
          })
        }

        return question
      }),
    )

    return questions
  }

  /**
   * Create Part 4 questions (3 questions with shared context and image)
   * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 5.1
   */
  async createPart4(body: unknown) {
    const dto = CreatePart4Schema.parse(body)

    // Validate question data
    validateQuestionData({
      type: dto.type,
      status: dto.status,
      contextText: dto.contextText,
      questionText: dto.questions[0].questionText, // At least one question text
    })

    const contextAudioUrl =
      dto.contextAudioUrl ?? (await generateAndUploadTTS(dto.contextText, 'context-p4'))

    const questions = await Promise.all(
      dto.questions.map(async (q) => {
        const questionAudioUrl =
          q.questionAudioUrl ?? (await generateAndUploadTTS(q.questionText, `q${q.questionNumber}`))
        const timing = getQuestionTiming(4, q.questionNumber)
        const question = await prisma.question.create({
          data: {
            partNumber: 4,
            questionNumber: q.questionNumber,
            contextText: dto.contextText,
            contextAudioUrl,
            imageUrls: [dto.imageUrl],
            imageContext: dto.imageContext,
            questionText: q.questionText,
            questionAudioUrl,
            type: dto.type ?? 'PRACTICE',
            status: dto.status ?? 'DRAFT',
            ...timing,
          },
        })

        // Create topic assignments if provided
        if (dto.topicIds && dto.topicIds.length > 0) {
          await prisma.questionTopicAssignment.createMany({
            data: dto.topicIds.map((topicId) => ({
              questionId: question.id,
              topicId,
            })),
          })
        }

        return question
      }),
    )

    return questions
  }

  /**
   * Create Part 5 question
   * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 5.1
   */
  async createPart5(body: unknown) {
    const dto = CreatePart5Schema.parse(body)

    // Validate question data
    validateQuestionData({
      type: dto.type,
      status: dto.status,
      questionText: dto.questionText,
    })

    const timing = getQuestionTiming(5, 11)

    const questionAudioUrl =
      dto.questionAudioUrl ?? (await generateAndUploadTTS(dto.questionText, 'q11'))

    const question = await prisma.question.create({
      data: {
        partNumber: 5,
        questionNumber: 11,
        questionText: dto.questionText,
        questionAudioUrl,
        type: dto.type ?? 'PRACTICE',
        status: dto.status ?? 'DRAFT',
        ...timing,
      },
    })

    // Create topic assignments if provided
    if (dto.topicIds && dto.topicIds.length > 0) {
      await prisma.questionTopicAssignment.createMany({
        data: dto.topicIds.map((topicId) => ({
          questionId: question.id,
          topicId,
        })),
      })
    }

    return question
  }

  /**
   * Get questions with flexible filtering
   * Validates: Requirements 1.1, 1.3, 1.4, 3.1, 3.2, 3.3, 5.1, 5.2, 5.3
   */
  async findAll(filters?: {
    partNumber?: number
    examSetId?: string
    type?: 'PRACTICE' | 'FORECAST' | 'CUSTOM'
    status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
    topicId?: string
  }) {
    if (filters?.examSetId) {
      // Get questions assigned to specific exam set
      const assignments = await prisma.questionAssignment.findMany({
        where: { examSetId: filters.examSetId },
        include: { question: true },
        orderBy: { questionNumber: 'asc' },
      })

      let results = assignments.map((a) => ({
        ...a.question,
        questionNumber: a.questionNumber,
      }))

      // Apply additional filters if provided
      if (filters.partNumber !== undefined) {
        results = results.filter((q) => q.partNumber === filters.partNumber)
      }
      if (filters.type) {
        results = results.filter((q) => q.type === filters.type)
      }
      if (filters.status) {
        results = results.filter((q) => q.status === filters.status)
      }

      return results
    }

    // Build where clause for filters
    const where: Prisma.QuestionWhereInput = {}

    if (filters?.partNumber !== undefined) {
      where.partNumber = filters.partNumber
    }

    if (filters?.type) {
      where.type = filters.type
    }

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.topicId) {
      where.topicAssignments = {
        some: {
          topicId: filters.topicId,
        },
      }
    }

    // Get all questions with filters
    return prisma.question.findMany({
      where,
      orderBy: [{ partNumber: 'asc' }, { questionNumber: 'asc' }, { createdAt: 'desc' }],
    })
  }

  /**
   * Legacy method for backward compatibility
   */
  async getQuestions(
    partNumber: number,
    filters?: {
      examSetId?: string
      type?: 'PRACTICE' | 'FORECAST' | 'CUSTOM'
      status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
      topicId?: string
    },
  ) {
    return this.findAll({ partNumber, ...filters })
  }

  // Returns each published exam set that has questions for this partNumber,
  // along with those questions — one card per exam set on the practice page.
  async getPracticeSets(partNumber: number) {
    const examSets = await prisma.examSet.findMany({
      where: {
        isPublished: true,
        questionAssignments: {
          some: {
            question: { partNumber },
          },
        },
      },
      include: {
        questionAssignments: {
          where: {
            question: { partNumber },
          },
          include: { question: true },
          orderBy: { questionNumber: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return examSets.map((set) => ({
      examSetId: set.id,
      examSetTitle: set.title,
      questions: set.questionAssignments.map((qa) => ({
        ...qa.question,
        questionNumber: qa.questionNumber,
      })),
    }))
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
   * Get all questions for a part (flat list with examSetId and topics)
   * Optimized for UI grid questions
   * Returns only PUBLISHED questions with their topics
   * Validates: Requirements 1.6, 3.1, 3.2, 5.4
   */
  async getByPart(partNumber: number, topicId?: string) {
    const where: Prisma.QuestionAssignmentWhereInput = {
      question: topicId
        ? {
            partNumber,
            status: 'PUBLISHED',
            topicAssignments: {
              some: {
                topicId,
              },
            },
          }
        : {
            partNumber,
            status: 'PUBLISHED',
          },
      examSet: { isPublished: true },
    }

    const assignments = await prisma.questionAssignment.findMany({
      where,
      include: {
        question: {
          include: {
            topicAssignments: {
              include: {
                topic: true,
              },
            },
          },
        },
        examSet: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: [{ examSetId: 'asc' }, { questionNumber: 'asc' }],
    })

    return assignments.map((a) => ({
      ...a.question,
      questionNumber: a.questionNumber,
      examSetId: a.examSet.id,
      examSetTitle: a.examSet.title,
      topics: a.question.topicAssignments.map((ta) => ta.topic),
    }))
  }

  /**
   * Legacy method for backward compatibility
   */
  async getQuestionsByPart(partNumber: number, topicId?: string) {
    return this.getByPart(partNumber, topicId)
  }

  /**
   * Get exam sets for a part (for filter sidebar)
   * Validates: Requirements 3.3, 3.4
   */
  async getExamSetsByPart(partNumber: number) {
    const examSets = await prisma.examSet.findMany({
      where: {
        isPublished: true,
        questionAssignments: {
          some: {
            question: { partNumber },
          },
        },
      },
      select: {
        id: true,
        title: true,
        _count: {
          select: {
            questionAssignments: {
              where: {
                question: { partNumber },
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
      questionCount: set._count.questionAssignments,
    }))
  }

  /**
   * Create a question with type, status, and topic assignments
   * This is a unified create method that delegates to part-specific methods
   * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 2.2, 2.3
   */
  async create(partNumber: number, data: unknown) {
    switch (partNumber) {
      case 1:
        return this.createPart1(data)
      case 2:
        return this.createPart2(data)
      case 3:
        return this.createPart3(data)
      case 4:
        return this.createPart4(data)
      case 5:
        return this.createPart5(data)
      default:
        throw new ValidationError(`Invalid part number: ${partNumber}`)
    }
  }

  /**
   * Update question status
   * Validates: Requirements 1.5, 1.6, 5.1, 5.2, 5.4
   */
  async updateStatus(id: string, status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') {
    // Validate status
    if (!['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(status)) {
      throw new ValidationError(`Invalid status: ${status}. Must be DRAFT, PUBLISHED, or ARCHIVED`)
    }

    return prisma.question.update({
      where: { id },
      data: { status },
    })
  }

  /**
   * Bulk update question status with transaction
   * Validates: Requirements 5.7, 12.4
   */
  async bulkUpdateStatus(questionIds: string[], status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') {
    // Validate status
    if (!['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(status)) {
      throw new ValidationError(`Invalid status: ${status}. Must be DRAFT, PUBLISHED, or ARCHIVED`)
    }

    return await prisma.$transaction(async (tx) => {
      const result = await tx.question.updateMany({
        where: { id: { in: questionIds } },
        data: { status },
      })
      return { updated: result.count }
    })
  }

  /**
   * Get topics with published question counts for a specific part
   * Validates: Requirements 3.4, 11.4, 11.5
   */
  async getTopicsByPart(partNumber: number) {
    const topics = await prisma.topic.findMany({
      include: {
        _count: {
          select: {
            questionAssignments: {
              where: {
                question: {
                  partNumber,
                  status: 'PUBLISHED',
                },
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc', // Alphabetical sorting
      },
    })

    // Filter out topics with zero questions and map to response format
    return topics
      .filter((t) => t._count.questionAssignments > 0)
      .map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        questionCount: t._count.questionAssignments,
      }))
  }
}

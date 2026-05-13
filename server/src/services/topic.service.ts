import { z } from 'zod'
import prisma from '@/lib/prisma'
import { ValidationError, ConflictError, NotFoundError } from '@/errors/app-error'

// ─── Zod schemas ──────────────────────────────────────────────────────────────

export const CreateTopicSchema = z.object({
  name: z.string().min(1, 'Topic name cannot be empty').max(100, 'Topic name too long'),
  description: z.string().optional(),
})

export const UpdateTopicSchema = z.object({
  name: z.string().min(1, 'Topic name cannot be empty').max(100, 'Topic name too long').optional(),
  description: z.string().optional(),
})

export const AssignTopicSchema = z.object({
  questionIds: z.array(z.string().uuid()),
})

// ─── Types ────────────────────────────────────────────────────────────────────

export type CreateTopicDto = z.infer<typeof CreateTopicSchema>
export type UpdateTopicDto = z.infer<typeof UpdateTopicSchema>
export type AssignTopicDto = z.infer<typeof AssignTopicSchema>

// ─── Service ──────────────────────────────────────────────────────────────────

export class TopicService {
  /**
   * Create a new topic with name validation
   * Validates: Requirements 2.1, 8.1, 8.6
   */
  async create(body: unknown) {
    const dto = CreateTopicSchema.parse(body)

    // Validate non-empty name (trim whitespace)
    const trimmedName = dto.name.trim()
    if (trimmedName.length === 0) {
      throw new ValidationError('Topic name cannot be empty')
    }

    // Check for duplicate name (case-insensitive)
    const existing = await prisma.topic.findFirst({
      where: {
        name: {
          equals: trimmedName,
          mode: 'insensitive',
        },
      },
    })

    if (existing) {
      throw new ConflictError(`A topic with the name "${trimmedName}" already exists`)
    }

    return prisma.topic.create({
      data: {
        name: trimmedName,
        description: dto.description,
      },
    })
  }

  /**
   * Get all topics with question counts
   * Validates: Requirements 8.2, 8.7
   */
  async findAll() {
    const topics = await prisma.topic.findMany({
      include: {
        _count: {
          select: {
            questionAssignments: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    return topics.map((topic) => ({
      id: topic.id,
      name: topic.name,
      description: topic.description,
      createdAt: topic.createdAt,
      updatedAt: topic.updatedAt,
      questionCount: topic._count.questionAssignments,
    }))
  }

  /**
   * Get a single topic by ID
   * Validates: Requirements 8.2
   */
  async findById(id: string) {
    const topic = await prisma.topic.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            questionAssignments: true,
          },
        },
      },
    })

    if (!topic) {
      throw new NotFoundError('Topic')
    }

    return {
      id: topic.id,
      name: topic.name,
      description: topic.description,
      createdAt: topic.createdAt,
      updatedAt: topic.updatedAt,
      questionCount: topic._count.questionAssignments,
    }
  }

  /**
   * Update topic name and/or description
   * Validates: Requirements 8.3
   */
  async update(id: string, body: unknown) {
    const dto = UpdateTopicSchema.parse(body)

    // Check if topic exists
    const existing = await prisma.topic.findUnique({
      where: { id },
    })

    if (!existing) {
      throw new NotFoundError('Topic')
    }

    // If updating name, validate and check for duplicates
    if (dto.name !== undefined) {
      const trimmedName = dto.name.trim()
      if (trimmedName.length === 0) {
        throw new ValidationError('Topic name cannot be empty')
      }

      // Check for duplicate name (case-insensitive), excluding current topic
      const duplicate = await prisma.topic.findFirst({
        where: {
          name: {
            equals: trimmedName,
            mode: 'insensitive',
          },
          id: {
            not: id,
          },
        },
      })

      if (duplicate) {
        throw new ConflictError(`A topic with the name "${trimmedName}" already exists`)
      }

      dto.name = trimmedName
    }

    return prisma.topic.update({
      where: { id },
      data: dto,
    })
  }

  /**
   * Delete a topic (cascade removes assignments, not questions)
   * Validates: Requirements 2.4, 8.4, 8.5
   */
  async delete(id: string) {
    // Check if topic exists
    const existing = await prisma.topic.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            questionAssignments: true,
          },
        },
      },
    })

    if (!existing) {
      throw new NotFoundError('Topic')
    }

    // Delete topic (cascade will remove assignments automatically)
    await prisma.topic.delete({
      where: { id },
    })

    return {
      success: true,
      affectedQuestions: existing._count.questionAssignments,
    }
  }

  /**
   * Bulk assign topic to multiple questions
   * Validates: Requirements 2.2, 2.3, 2.6
   */
  async assignToQuestions(topicId: string, body: unknown) {
    const dto = AssignTopicSchema.parse(body)

    // Check if topic exists
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
    })

    if (!topic) {
      throw new NotFoundError('Topic')
    }

    // Verify all questions exist
    const questions = await prisma.question.findMany({
      where: {
        id: {
          in: dto.questionIds,
        },
      },
      select: { id: true },
    })

    if (questions.length !== dto.questionIds.length) {
      throw new ValidationError('One or more questions not found')
    }

    // Create assignments (ignore duplicates)
    const assignments = await Promise.all(
      dto.questionIds.map((questionId) =>
        prisma.questionTopicAssignment.upsert({
          where: {
            questionId_topicId: {
              questionId,
              topicId,
            },
          },
          create: {
            questionId,
            topicId,
          },
          update: {},
        }),
      ),
    )

    return {
      assigned: assignments.length,
    }
  }

  /**
   * Bulk unassign topic from multiple questions
   * Validates: Requirements 2.2, 2.3
   */
  async unassignFromQuestions(topicId: string, body: unknown) {
    const dto = AssignTopicSchema.parse(body)

    // Check if topic exists
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
    })

    if (!topic) {
      throw new NotFoundError('Topic')
    }

    // Delete assignments
    const result = await prisma.questionTopicAssignment.deleteMany({
      where: {
        topicId,
        questionId: {
          in: dto.questionIds,
        },
      },
    })

    return {
      unassigned: result.count,
    }
  }
}

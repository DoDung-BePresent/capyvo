import { z } from 'zod'
import prisma from '@/lib/prisma'
import { NotFoundError, ValidationError } from '@/errors/app-error'

export const CreateExamSetSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['PRACTICE', 'FORECAST', 'CUSTOM']).default('PRACTICE'),
})

export const UpdateExamSetSchema = CreateExamSetSchema.partial().extend({
  isPublished: z.boolean().optional(),
})

export class ExamSetService {
  async findAll() {
    return prisma.examSet.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { questionAssignments: true } } },
    })
  }

  async findById(id: string) {
    const examSet = await prisma.examSet.findUnique({
      where: { id },
      include: {
        questionAssignments: {
          orderBy: { questionNumber: 'asc' },
          include: { question: true },
        },
      },
    })
    if (!examSet) throw new NotFoundError('ExamSet')

    // Transform to match old structure for backward compatibility
    return {
      ...examSet,
      questions: examSet.questionAssignments.map((qa) => ({
        ...qa.question,
        questionNumber: qa.questionNumber, // Use position in this exam set
      })),
    }
  }

  async create(body: unknown, userId: string) {
    const dto = CreateExamSetSchema.parse(body)
    return prisma.examSet.create({
      data: { ...dto, createdBy: userId },
    })
  }

  async update(id: string, body: unknown) {
    await this.findById(id)
    const dto = UpdateExamSetSchema.parse(body)
    return prisma.examSet.update({ where: { id }, data: dto })
  }

  async remove(id: string) {
    await this.findById(id)
    // Delete all question assignments (cascade will handle this automatically)
    return prisma.examSet.delete({ where: { id } })
  }

  async assignQuestion(examSetId: string, questionId: string) {
    await this.findById(examSetId)
    const question = await prisma.question.findUnique({ where: { id: questionId } })
    if (!question) throw new NotFoundError('Question')

    // Check if question is already assigned to this exam set
    const existing = await prisma.questionAssignment.findFirst({
      where: { examSetId, questionId },
    })
    if (existing) {
      throw new ValidationError('This question is already assigned to this exam set')
    }

    // Find if there's already a question at this position in the exam set
    const conflicting = await prisma.questionAssignment.findUnique({
      where: {
        examSetId_questionNumber: {
          examSetId,
          questionNumber: question.questionNumber,
        },
      },
    })

    if (conflicting) {
      // Remove the conflicting assignment
      await prisma.questionAssignment.delete({ where: { id: conflicting.id } })
    }

    // Create new assignment
    await prisma.questionAssignment.create({
      data: {
        examSetId,
        questionId,
        questionNumber: question.questionNumber,
      },
    })

    return question
  }

  async unassignQuestion(examSetId: string, questionId: string) {
    const assignment = await prisma.questionAssignment.findFirst({
      where: { examSetId, questionId },
    })
    if (!assignment) {
      throw new ValidationError('Question not assigned to this exam set')
    }

    await prisma.questionAssignment.delete({ where: { id: assignment.id } })

    return prisma.question.findUnique({ where: { id: questionId } })
  }

  async findPublished() {
    return prisma.examSet.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { questionAssignments: true } } },
    })
  }

  async findPublishedById(id: string) {
    const examSet = await prisma.examSet.findUnique({
      where: { id, isPublished: true },
      include: {
        questionAssignments: {
          orderBy: { questionNumber: 'asc' },
          include: { question: true },
        },
      },
    })
    if (!examSet) throw new NotFoundError('ExamSet')

    // Transform to match old structure
    return {
      ...examSet,
      questions: examSet.questionAssignments.map((qa) => ({
        ...qa.question,
        questionNumber: qa.questionNumber,
      })),
    }
  }

  async getPoolQuestions(questionNumber: number) {
    const questions = await prisma.question.findMany({
      where: { questionNumber },
      orderBy: { createdAt: 'desc' },
      include: {
        examSetAssignments: {
          include: {
            examSet: { select: { id: true, title: true } },
          },
        },
      },
    })

    // Transform to show all exam sets this question belongs to
    return questions.map((q) => ({
      ...q,
      examSets: q.examSetAssignments.map((qa) => qa.examSet),
    }))
  }
}

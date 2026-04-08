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
      include: { _count: { select: { questions: true } } },
    })
  }

  async findById(id: string) {
    const examSet = await prisma.examSet.findUnique({
      where: { id },
      include: {
        questions: { orderBy: { questionNumber: 'asc' } },
      },
    })
    if (!examSet) throw new NotFoundError('ExamSet')
    return examSet
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
    // Unlink all questions before deleting
    await prisma.question.updateMany({ where: { examSetId: id }, data: { examSetId: null } })
    return prisma.examSet.delete({ where: { id } })
  }

  async assignQuestion(examSetId: string, questionId: string) {
    await this.findById(examSetId)
    const question = await prisma.question.findUnique({ where: { id: questionId } })
    if (!question) throw new NotFoundError('Question')
    if (question.examSetId && question.examSetId !== examSetId) {
      throw new ValidationError('This question is already assigned to another exam set')
    }
    // Unassign any existing question with same questionNumber in this examSet
    await prisma.question.updateMany({
      where: { examSetId, questionNumber: question.questionNumber },
      data: { examSetId: null },
    })
    return prisma.question.update({ where: { id: questionId }, data: { examSetId } })
  }

  async unassignQuestion(examSetId: string, questionId: string) {
    const question = await prisma.question.findUnique({ where: { id: questionId } })
    if (!question) throw new NotFoundError('Question')
    if (question.examSetId !== examSetId) throw new ValidationError('Question not in this exam set')
    return prisma.question.update({ where: { id: questionId }, data: { examSetId: null } })
  }

  async getPoolQuestions(questionNumber: number) {
    return prisma.question.findMany({
      where: { questionNumber },
      orderBy: { createdAt: 'desc' },
      include: { examSet: { select: { id: true, title: true } } },
    })
  }
}

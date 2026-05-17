import { z } from 'zod'
import prisma from '@/lib/prisma'
import { NotFoundError, ValidationError } from '@/errors/app-error'
import { Prisma } from '@prisma/client'

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
    const examSet = await this.findById(id)
    const dto = UpdateExamSetSchema.parse(body)

    // If trying to publish, validate that exam set is complete (has 11 questions)
    if (dto.isPublished === true) {
      // Check current isComplete status
      if (!examSet.isComplete) {
        const count = await prisma.questionAssignment.count({
          where: { examSetId: id },
        })
        throw new ValidationError(
          `Cannot publish exam set with only ${count}/11 questions. Please add all 11 questions first.`,
        )
      }
    }

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

    // Update isComplete status
    await this.updateCompleteStatus(examSetId)

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

    // Update isComplete status
    await this.updateCompleteStatus(examSetId)

    return prisma.question.findUnique({ where: { id: questionId } })
  }

  /**
   * Update isComplete status based on question count
   * If exam set has < 11 questions and is published, unpublish it
   */
  private async updateCompleteStatus(examSetId: string) {
    const count = await prisma.questionAssignment.count({
      where: { examSetId },
    })

    const isComplete = count === 11

    // If not complete and currently published, unpublish it
    const examSet = await prisma.examSet.findUnique({
      where: { id: examSetId },
      select: { isPublished: true },
    })

    if (!isComplete && examSet?.isPublished) {
      await prisma.examSet.update({
        where: { id: examSetId },
        data: { isComplete, isPublished: false },
      })
    } else {
      await prisma.examSet.update({
        where: { id: examSetId },
        data: { isComplete },
      })
    }
  }

  async findPublished() {
    return prisma.examSet.findMany({
      where: { isPublished: true, isComplete: true },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { questionAssignments: true } } },
    })
  }

  async findPublishedById(id: string) {
    const examSet = await prisma.examSet.findUnique({
      where: { id, isPublished: true, isComplete: true },
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

  async getPoolQuestions(
    questionNumber: number,
    search?: string,
    assignmentStatus?: 'all' | 'assigned' | 'unassigned',
  ) {
    // Build where clause
    const where: Prisma.QuestionWhereInput = {
      questionNumber,
      status: 'PUBLISHED', // Only show published questions
    }

    // Add search filter (case-insensitive)
    if (search) {
      where.OR = [
        { contentText: { contains: search, mode: 'insensitive' } },
        { questionText: { contains: search, mode: 'insensitive' } },
        { contextText: { contains: search, mode: 'insensitive' } },
      ]
    }

    const questions = await prisma.question.findMany({
      where,
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
    let result = questions.map((q) => ({
      ...q,
      examSets: q.examSetAssignments.map((qa) => qa.examSet),
    }))

    // Filter by assignment status
    if (assignmentStatus === 'assigned') {
      result = result.filter((q) => q.examSets.length > 0)
    } else if (assignmentStatus === 'unassigned') {
      result = result.filter((q) => q.examSets.length === 0)
    }

    return result
  }

  async getPoolQuestionSets(
    questionNumber: number,
    search?: string,
    assignmentStatus?: 'all' | 'assigned' | 'unassigned',
  ) {
    // For Part 3 & 4, questionNumber should be 5, 6, 7, 8, 9, or 10
    // We need to group questions by setId
    const baseQuestionNumber = questionNumber <= 7 ? 5 : 8 // 5-7 or 8-10

    // Build where clause
    const where: Prisma.QuestionWhereInput = {
      questionNumber: { gte: baseQuestionNumber, lte: baseQuestionNumber + 2 },
      status: 'PUBLISHED',
      setId: { not: null }, // Only questions with setId
    }

    // Add search filter (case-insensitive)
    if (search) {
      where.OR = [
        { contentText: { contains: search, mode: 'insensitive' } },
        { questionText: { contains: search, mode: 'insensitive' } },
        { contextText: { contains: search, mode: 'insensitive' } },
      ]
    }

    const questions = await prisma.question.findMany({
      where,
      orderBy: [{ setId: 'asc' }, { questionNumber: 'asc' }],
      include: {
        examSetAssignments: {
          include: {
            examSet: { select: { id: true, title: true } },
          },
        },
      },
    })

    // Group by setId
    const setMap = new Map<
      string,
      Array<{
        id: string
        questionNumber: number
        contentText: string | null
        questionText: string | null
        contextText: string | null
        imageUrls: string[]
        questionAudioUrl: string | null
        imageContext: string | null
        examSets: Array<{ id: string; title: string }>
      }>
    >()

    for (const q of questions) {
      if (!q.setId) continue
      if (!setMap.has(q.setId)) {
        setMap.set(q.setId, [])
      }
      setMap.get(q.setId)!.push({
        id: q.id,
        questionNumber: q.questionNumber,
        contentText: q.contentText,
        questionText: q.questionText,
        contextText: q.contextText,
        imageUrls: q.imageUrls,
        questionAudioUrl: q.questionAudioUrl,
        imageContext: q.imageContext,
        examSets: q.examSetAssignments.map((qa) => qa.examSet),
      })
    }

    // Convert to array of sets
    let sets = Array.from(setMap.entries())
      .filter(([, questions]) => questions.length === 3) // Only complete sets
      .map(([setId, questions]) => ({
        setId,
        questions,
        // A set is assigned if ANY question in the set has assignments
        examSets: questions.flatMap((q) => q.examSets),
      }))

    // Remove duplicate exam sets
    sets = sets.map((set) => ({
      ...set,
      examSets: Array.from(new Map(set.examSets.map((es) => [es.id, es])).values()),
    }))

    // Filter by assignment status
    if (assignmentStatus === 'assigned') {
      sets = sets.filter((set) => set.examSets.length > 0)
    } else if (assignmentStatus === 'unassigned') {
      sets = sets.filter((set) => set.examSets.length === 0)
    }

    return sets
  }

  async assignQuestionSet(examSetId: string, setId: string) {
    await this.findById(examSetId)

    // Find all 3 questions in the set
    const questions = await prisma.question.findMany({
      where: { setId, status: 'PUBLISHED' },
      orderBy: { questionNumber: 'asc' },
    })

    if (questions.length !== 3) {
      throw new ValidationError('Question set must have exactly 3 questions')
    }

    // Validate that questions are consecutive (5-6-7 or 8-9-10)
    const questionNumbers = questions.map((q) => q.questionNumber).sort((a, b) => a - b)
    const isValid =
      (questionNumbers[0] === 5 && questionNumbers[1] === 6 && questionNumbers[2] === 7) ||
      (questionNumbers[0] === 8 && questionNumbers[1] === 9 && questionNumbers[2] === 10)

    if (!isValid) {
      throw new ValidationError('Question set must contain questions 5-6-7 or 8-9-10')
    }

    // Check if any question is already assigned to this exam set
    for (const question of questions) {
      const existing = await prisma.questionAssignment.findFirst({
        where: { examSetId, questionId: question.id },
      })
      if (existing) {
        throw new ValidationError('One or more questions are already assigned to this exam set')
      }
    }

    // Remove any conflicting assignments at these positions
    for (const question of questions) {
      const conflicting = await prisma.questionAssignment.findUnique({
        where: {
          examSetId_questionNumber: {
            examSetId,
            questionNumber: question.questionNumber,
          },
        },
      })
      if (conflicting) {
        await prisma.questionAssignment.delete({ where: { id: conflicting.id } })
      }
    }

    // Assign all 3 questions
    await prisma.questionAssignment.createMany({
      data: questions.map((q) => ({
        examSetId,
        questionId: q.id,
        questionNumber: q.questionNumber,
      })),
    })

    // Update isComplete status
    await this.updateCompleteStatus(examSetId)

    return questions
  }
}

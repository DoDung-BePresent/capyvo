import prisma from '@/lib/prisma'
import { ForbiddenError, ValidationError, NotFoundError } from '@/errors/app-error'
import { z } from 'zod'

const ALLOWED_EMOJIS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '😍', '💖', '🤔'] as const
type AllowedEmoji = (typeof ALLOWED_EMOJIS)[number]

// ─── Validation Schemas ───────────────────────────────────────────────────────

export const CreateShareSchema = z.object({
  responseId: z.string().uuid(),
})

export const ToggleReactionSchema = z.object({
  emoji: z.enum(ALLOWED_EMOJIS),
})

export const GetSharesByQuestionSchema = z.object({
  questionId: z.string().uuid(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
})

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PublicShareDetail {
  id: string
  createdAt: Date
  user: {
    id: string
    fullName: string | null
    email: string
  }
  response: {
    id: string
    transcript: string | null
    audioUrl: string | null
    createdAt: Date
  }
  reactions: Array<{
    emoji: string
    count: number
    userReacted: boolean
  }>
}

export interface MyShareDetail {
  id: string
  createdAt: Date
  question: {
    id: string
    partNumber: number
    questionNumber: number
  }
  response: {
    id: string
    transcript: string | null
  }
  reactionCount: number
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class ShareService {
  /**
   * Create a public share for a response
   * Both Basic and Premium users can share (both have transcripts)
   */
  async createShare(responseId: string, userId: string): Promise<{ shareId: string }> {
    // 1. Verify response belongs to user and has transcript
    const response = await prisma.userResponse.findFirst({
      where: {
        id: responseId,
        session: { userId },
      },
      include: {
        session: {
          select: {
            userId: true,
            partNumber: true,
          },
        },
        question: {
          select: {
            id: true,
            partNumber: true,
          },
        },
      },
    })

    if (!response) {
      throw new NotFoundError('Response not found or access denied')
    }

    // Only allow sharing from practice sessions (partNumber is not null)
    if (response.session.partNumber === null) {
      throw new ForbiddenError('Cannot share responses from full test sessions')
    }

    if (!response.transcript) {
      throw new ForbiddenError(
        'Cannot share response without transcript. Please wait for transcription to complete.',
      )
    }

    // 2. Check if already shared
    const existingShare = await prisma.publicShare.findUnique({
      where: { responseId },
    })

    if (existingShare) {
      throw new ValidationError('This response has already been shared')
    }

    // 3. Create share
    const share = await prisma.publicShare.create({
      data: {
        responseId,
        userId,
        questionId: response.question.id,
      },
    })

    return { shareId: share.id }
  }

  /**
   * Delete a public share (only owner can delete)
   */
  async deleteShare(shareId: string, userId: string): Promise<void> {
    const share = await prisma.publicShare.findUnique({
      where: { id: shareId },
    })

    if (!share) {
      throw new NotFoundError('Share not found')
    }

    if (share.userId !== userId) {
      throw new ForbiddenError('You can only delete your own shares')
    }

    await prisma.publicShare.delete({
      where: { id: shareId },
    })
  }

  /**
   * Get all public shares for a specific question
   */
  async getSharesByQuestion(
    questionId: string,
    currentUserId: string,
    limit = 20,
    offset = 0,
  ): Promise<PublicShareDetail[]> {
    const shares = await prisma.publicShare.findMany({
      where: { questionId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        response: {
          select: {
            id: true,
            transcript: true,
            audioUrl: true,
            createdAt: true,
          },
        },
        reactions: {
          select: {
            emoji: true,
            userId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })

    // Group reactions by emoji and count
    return shares.map((share) => {
      const reactionMap = new Map<string, { count: number; userIds: string[] }>()

      share.reactions.forEach((r) => {
        const existing = reactionMap.get(r.emoji)
        if (existing) {
          existing.count++
          existing.userIds.push(r.userId)
        } else {
          reactionMap.set(r.emoji, { count: 1, userIds: [r.userId] })
        }
      })

      const reactions = Array.from(reactionMap.entries()).map(([emoji, data]) => ({
        emoji,
        count: data.count,
        userReacted: data.userIds.includes(currentUserId), // Check if current user reacted
      }))

      return {
        id: share.id,
        createdAt: share.createdAt,
        user: share.user,
        response: share.response,
        reactions,
      }
    })
  }

  /**
   * Add or update reaction to a share
   * User can only have 1 reaction per share
   */
  async toggleReaction(
    shareId: string,
    userId: string,
    emoji: string,
  ): Promise<{ action: 'added' | 'removed' | 'updated' }> {
    // Validate emoji
    if (!ALLOWED_EMOJIS.includes(emoji as AllowedEmoji)) {
      throw new ValidationError(`Invalid emoji. Allowed: ${ALLOWED_EMOJIS.join(', ')}`)
    }

    // Check share exists
    const share = await prisma.publicShare.findUnique({
      where: { id: shareId },
    })

    if (!share) {
      throw new NotFoundError('Share not found')
    }

    // Check existing reaction
    const existingReaction = await prisma.reaction.findUnique({
      where: {
        shareId_userId: {
          shareId,
          userId,
        },
      },
    })

    if (!existingReaction) {
      // Add new reaction
      await prisma.reaction.create({
        data: {
          shareId,
          userId,
          emoji,
        },
      })
      return { action: 'added' }
    }

    if (existingReaction.emoji === emoji) {
      // Same emoji → Remove reaction
      await prisma.reaction.delete({
        where: {
          shareId_userId: {
            shareId,
            userId,
          },
        },
      })
      return { action: 'removed' }
    }

    // Different emoji → Update reaction
    await prisma.reaction.update({
      where: {
        shareId_userId: {
          shareId,
          userId,
        },
      },
      data: { emoji },
    })
    return { action: 'updated' }
  }

  /**
   * Get user's own shares
   */
  async getMyShares(userId: string): Promise<MyShareDetail[]> {
    const shares = await prisma.publicShare.findMany({
      where: { userId },
      include: {
        question: {
          select: {
            id: true,
            partNumber: true,
            questionNumber: true,
          },
        },
        response: {
          select: {
            id: true,
            transcript: true,
          },
        },
        reactions: {
          select: {
            id: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return shares.map((share) => ({
      id: share.id,
      createdAt: share.createdAt,
      question: share.question,
      response: share.response,
      reactionCount: share.reactions.length,
    }))
  }
}

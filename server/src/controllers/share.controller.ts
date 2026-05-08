import type { Request, Response, NextFunction } from 'express'
import {
  ShareService,
  CreateShareSchema,
  ToggleReactionSchema,
  GetSharesByQuestionSchema,
} from '@/services/share.service'
import type { AuthRequest } from '@/middlewares/authenticate'

export class ShareController {
  private service = new ShareService()

  /**
   * POST /api/shares
   * Create a public share
   */
  async createShare(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const userId = (req as AuthRequest).userId
    const { responseId } = CreateShareSchema.parse(req.body)

    const result = await this.service.createShare(responseId, userId)
    res.status(201).json({ success: true, data: result })
  }

  /**
   * DELETE /api/shares/:shareId
   * Delete a share (only owner)
   */
  async deleteShare(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const userId = (req as AuthRequest).userId
    const shareId = req.params['shareId'] as string

    await this.service.deleteShare(shareId, userId)
    res.json({ success: true, message: 'Share deleted successfully' })
  }

  /**
   * GET /api/shares/question/:questionId
   * Get all shares for a question
   */
  async getSharesByQuestion(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const { questionId, limit, offset } = GetSharesByQuestionSchema.parse({
      questionId: req.params['questionId'],
      limit: req.query['limit'],
      offset: req.query['offset'],
    })

    const shares = await this.service.getSharesByQuestion(questionId, limit, offset)

    // Mark which reactions the current user has made
    const sharesWithUserReactions = shares.map((share) => ({
      ...share,
      reactions: share.reactions.map((reaction) => ({
        ...reaction,
        // This will be properly implemented when we add userId tracking
        userReacted: false, // TODO: Check if currentUserId reacted with this emoji
      })),
    }))

    res.json({ success: true, data: sharesWithUserReactions })
  }

  /**
   * POST /api/shares/:shareId/reactions
   * Toggle reaction on a share
   */
  async toggleReaction(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const userId = (req as AuthRequest).userId
    const shareId = req.params['shareId'] as string
    const { emoji } = ToggleReactionSchema.parse(req.body)

    const result = await this.service.toggleReaction(shareId, userId, emoji)
    res.json({ success: true, data: result })
  }

  /**
   * GET /api/shares/my
   * Get current user's shares
   */
  async getMyShares(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const userId = (req as AuthRequest).userId
    const shares = await this.service.getMyShares(userId)
    res.json({ success: true, data: shares })
  }
}

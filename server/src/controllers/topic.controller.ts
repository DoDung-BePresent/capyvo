import type { Request, Response, NextFunction } from 'express'
import { TopicService } from '@/services/topic.service'

export class TopicController {
  private service = new TopicService()

  /**
   * GET /api/topics
   * Get all topics with question counts, optionally filtered by partNumber
   * Validates: Requirements 8.2, 8.7
   */
  async getAll(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const partNumber = req.query['partNumber'] ? Number(req.query['partNumber']) : undefined
    const topics = await this.service.findAll(partNumber)
    res.json({ success: true, data: topics })
  }

  /**
   * POST /api/topics
   * Create a new topic
   * Validates: Requirements 2.1, 8.1, 8.6
   */
  async create(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const topic = await this.service.create(req.body)
    res.status(201).json({ success: true, data: topic })
  }

  /**
   * PATCH /api/topics/:id
   * Update a topic
   * Validates: Requirements 8.3
   */
  async update(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const id = req.params['id'] as string
    const topic = await this.service.update(id, req.body)
    res.json({ success: true, data: topic })
  }

  /**
   * DELETE /api/topics/:id
   * Delete a topic (cascade removes assignments, not questions)
   * Validates: Requirements 2.4, 8.4, 8.5
   */
  async delete(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const id = req.params['id'] as string
    const result = await this.service.delete(id)
    res.json({ success: true, data: result })
  }

  /**
   * POST /api/topics/:id/assign
   * Bulk assign topic to multiple questions
   * Validates: Requirements 2.2, 2.3, 2.6
   */
  async assignToQuestions(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const id = req.params['id'] as string
    const result = await this.service.assignToQuestions(id, req.body)
    res.json({ success: true, data: result })
  }

  /**
   * DELETE /api/topics/:id/unassign
   * Bulk unassign topic from multiple questions
   * Validates: Requirements 2.2, 2.3
   */
  async unassignFromQuestions(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const id = req.params['id'] as string
    const result = await this.service.unassignFromQuestions(id, req.body)
    res.json({ success: true, data: result })
  }
}

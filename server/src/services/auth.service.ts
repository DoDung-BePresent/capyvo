import prisma from '@/lib/prisma'
import type { User } from '@prisma/client'

export class AuthService {
  /**
   * Lấy user từ DB. Nếu chưa tồn tại thì tạo mới (first login).
   */
  async findOrCreateUser(supabaseId: string, email: string): Promise<User> {
    const existing = await prisma.user.findUnique({ where: { id: supabaseId } })
    if (existing) return existing

    return prisma.user.create({
      data: {
        id: supabaseId,
        email,
      },
    })
  }

  async getProfile(userId: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id: userId } })
  }
}

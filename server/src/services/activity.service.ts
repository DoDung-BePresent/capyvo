import prisma from '@/lib/prisma'

export class ActivityService {
  /**
   * Get user's practice activity grouped by date
   * Returns count of completed responses per day for the last 90 days
   * Uses Vietnam timezone (UTC+7) for date grouping
   */
  async getUserActivity(userId: string): Promise<{
    activityByDate: Record<string, number>
    currentStreak: number
    longestStreak: number
  }> {
    const now = new Date()
    const ninetyDaysAgo = new Date(now)
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    // Get all user responses from the last 90 days
    const responses = await prisma.userResponse.findMany({
      where: {
        session: { userId },
        createdAt: { gte: ninetyDaysAgo },
      },
      select: {
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    // Group by date (YYYY-MM-DD) using Vietnam timezone (UTC+7)
    const activityByDate: Record<string, number> = {}
    const uniqueDates = new Set<string>()

    responses.forEach((r) => {
      // Convert to Vietnam timezone (UTC+7)
      const vnDate = new Date(r.createdAt.getTime() + 7 * 60 * 60 * 1000)
      const dateKey = vnDate.toISOString().slice(0, 10)
      activityByDate[dateKey] = (activityByDate[dateKey] || 0) + 1
      uniqueDates.add(dateKey)
    })

    // Calculate streaks
    const sortedDates = Array.from(uniqueDates).sort()
    const { currentStreak, longestStreak } = this.calculateStreaks(sortedDates)

    return {
      activityByDate,
      currentStreak,
      longestStreak,
    }
  }

  /**
   * Calculate current and longest streak from sorted date strings
   * Uses Vietnam timezone (UTC+7)
   */
  private calculateStreaks(sortedDates: string[]): {
    currentStreak: number
    longestStreak: number
  } {
    if (sortedDates.length === 0) {
      return { currentStreak: 0, longestStreak: 0 }
    }

    // Get today in Vietnam timezone
    const now = new Date()
    const vnNow = new Date(now.getTime() + 7 * 60 * 60 * 1000)
    vnNow.setUTCHours(0, 0, 0, 0)
    const todayStr = vnNow.toISOString().slice(0, 10)

    const yesterday = new Date(vnNow)
    yesterday.setUTCDate(yesterday.getUTCDate() - 1)
    const yesterdayStr = yesterday.toISOString().slice(0, 10)

    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 1

    // Check if user practiced today or yesterday for current streak
    const lastDate = sortedDates[sortedDates.length - 1]
    if (lastDate === todayStr || lastDate === yesterdayStr) {
      currentStreak = 1

      // Count backwards from last date
      for (let i = sortedDates.length - 2; i >= 0; i--) {
        const currentDate = new Date(sortedDates[i + 1] + 'T00:00:00Z')
        const prevDate = new Date(sortedDates[i] + 'T00:00:00Z')
        const diffDays = Math.floor(
          (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24),
        )

        if (diffDays === 1) {
          currentStreak++
        } else {
          break
        }
      }
    }

    // Calculate longest streak
    for (let i = 1; i < sortedDates.length; i++) {
      const currentDate = new Date(sortedDates[i] + 'T00:00:00Z')
      const prevDate = new Date(sortedDates[i - 1] + 'T00:00:00Z')
      const diffDays = Math.floor(
        (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24),
      )

      if (diffDays === 1) {
        tempStreak++
        longestStreak = Math.max(longestStreak, tempStreak)
      } else {
        tempStreak = 1
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak, currentStreak)

    return { currentStreak, longestStreak }
  }
}

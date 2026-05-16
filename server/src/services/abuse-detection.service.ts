import prisma from '@/lib/prisma'

export interface SuspiciousUser {
  userId: string
  email: string
  fullName: string | null
  flags: string[]
  metrics: {
    sessionsLast24h: number
    sessionsLast7d: number
    avgSessionDuration: number
    totalResponses: number
    failedResponses: number
    failureRate: number
  }
  riskScore: number
  createdAt: Date
}

export interface AbuseStats {
  totalUsers: number
  suspiciousUsers: number
  flaggedUsers: SuspiciousUser[]
  thresholds: {
    maxSessionsPer24h: number
    maxSessionsPer7d: number
    maxFailureRate: number
  }
}

export class AbuseDetectionService {
  // Configurable thresholds
  private readonly THRESHOLDS = {
    MAX_SESSIONS_PER_24H: 50, // More than 50 sessions in 24h is suspicious
    MAX_SESSIONS_PER_7D: 200, // More than 200 sessions in 7 days
    MAX_FAILURE_RATE: 0.5, // More than 50% failed responses
    MIN_SESSIONS_TO_CHECK: 5, // Only check users with at least 5 sessions
  }

  async detectAbuse(): Promise<AbuseStats> {
    const now = new Date()
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Get all users with their session counts
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        createdAt: true,
        _count: {
          select: {
            practiceSessions: true,
          },
        },
      },
    })

    const flaggedUsers: SuspiciousUser[] = []

    // Check each user for suspicious activity
    for (const user of users) {
      // Skip users with very few sessions
      if (user._count.practiceSessions < this.THRESHOLDS.MIN_SESSIONS_TO_CHECK) {
        continue
      }

      const flags: string[] = []
      let riskScore = 0

      // Get sessions in last 24h
      const sessionsLast24h = await prisma.practiceSession.count({
        where: {
          userId: user.id,
          startedAt: { gte: last24h },
        },
      })

      // Get sessions in last 7 days
      const sessionsLast7d = await prisma.practiceSession.count({
        where: {
          userId: user.id,
          startedAt: { gte: last7d },
        },
      })

      // Get response stats via sessions
      const userSessions = await prisma.practiceSession.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          startedAt: true,
          completedAt: true,
          userResponses: {
            select: {
              id: true,
              overallScore: true,
            },
          },
        },
      })

      // Calculate response metrics
      const allResponses = userSessions.flatMap((s) => s.userResponses)
      const totalResponses = allResponses.length
      const failedResponses = allResponses.filter(
        (r) => r.overallScore === null || r.overallScore < 1,
      ).length
      const failureRate = totalResponses > 0 ? failedResponses / totalResponses : 0

      // Calculate average session duration
      const completedSessions = userSessions.filter(
        (s) => s.startedAt !== null && s.completedAt !== null,
      )
      const avgSessionDuration =
        completedSessions.length > 0
          ? completedSessions.reduce((sum, s) => {
              const duration = s.completedAt!.getTime() - s.startedAt.getTime()
              return sum + duration
            }, 0) / completedSessions.length
          : 0

      // Flag 1: Too many sessions in 24h
      if (sessionsLast24h > this.THRESHOLDS.MAX_SESSIONS_PER_24H) {
        flags.push(
          `${sessionsLast24h} sessions trong 24h (ngưỡng: ${this.THRESHOLDS.MAX_SESSIONS_PER_24H})`,
        )
        riskScore += 30
      }

      // Flag 2: Too many sessions in 7 days
      if (sessionsLast7d > this.THRESHOLDS.MAX_SESSIONS_PER_7D) {
        flags.push(
          `${sessionsLast7d} sessions trong 7 ngày (ngưỡng: ${this.THRESHOLDS.MAX_SESSIONS_PER_7D})`,
        )
        riskScore += 20
      }

      // Flag 3: High failure rate
      if (failureRate > this.THRESHOLDS.MAX_FAILURE_RATE && totalResponses >= 10) {
        flags.push(
          `Tỷ lệ lỗi cao: ${(failureRate * 100).toFixed(1)}% (ngưỡng: ${this.THRESHOLDS.MAX_FAILURE_RATE * 100}%)`,
        )
        riskScore += 25
      }

      // Flag 4: Very short session duration (possible bot)
      if (avgSessionDuration < 30000 && completedSessions.length >= 5) {
        // Less than 30 seconds
        flags.push(`Thời gian session ngắn bất thường: ${(avgSessionDuration / 1000).toFixed(0)}s`)
        riskScore += 25
      }

      // Flag 5: Account created recently with high activity
      const accountAge = now.getTime() - user.createdAt.getTime()
      const accountAgeDays = accountAge / (24 * 60 * 60 * 1000)
      if (accountAgeDays < 7 && sessionsLast7d > 50) {
        flags.push(`Tài khoản mới (${accountAgeDays.toFixed(0)} ngày) với hoạt động cao`)
        riskScore += 15
      }

      // If user has any flags, add to suspicious list
      if (flags.length > 0) {
        flaggedUsers.push({
          userId: user.id,
          email: user.email,
          fullName: user.fullName,
          flags,
          metrics: {
            sessionsLast24h,
            sessionsLast7d,
            avgSessionDuration: avgSessionDuration / 1000, // Convert to seconds
            totalResponses,
            failedResponses,
            failureRate,
          },
          riskScore: Math.min(riskScore, 100), // Cap at 100
          createdAt: user.createdAt,
        })
      }
    }

    // Sort by risk score (highest first)
    flaggedUsers.sort((a, b) => b.riskScore - a.riskScore)

    return {
      totalUsers: users.length,
      suspiciousUsers: flaggedUsers.length,
      flaggedUsers,
      thresholds: {
        maxSessionsPer24h: this.THRESHOLDS.MAX_SESSIONS_PER_24H,
        maxSessionsPer7d: this.THRESHOLDS.MAX_SESSIONS_PER_7D,
        maxFailureRate: this.THRESHOLDS.MAX_FAILURE_RATE,
      },
    }
  }
}

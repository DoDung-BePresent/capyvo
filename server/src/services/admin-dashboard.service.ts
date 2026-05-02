import prisma from '@/lib/prisma'

function subDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() - days)
  return d
}

function formatDay(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0')
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${d}/${m}`
}

export class AdminDashboardService {
  async getStats() {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const thirtyDaysAgo = subDays(now, 29)

    const [
      totalUsers,
      newUsersThisMonth,
      totalPaidPayments,
      revenueThisMonth,
      totalSessions,
      sessionsThisMonth,
      totalQuestions,
      questionsByPart,
      tokenPackageStats,
      revenueByDay,
      sessionsByDay,
      recentPayments,
    ] = await Promise.all([
      // Total users
      prisma.user.count(),

      // New users this month
      prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),

      // Total paid payments + total revenue
      prisma.payment.aggregate({
        where: { status: 'PAID' },
        _count: { id: true },
        _sum: { amount: true },
      }),

      // Revenue this month
      prisma.payment.aggregate({
        where: { status: 'PAID', paidAt: { gte: startOfMonth } },
        _sum: { amount: true },
      }),

      // Total sessions
      prisma.practiceSession.count(),

      // Sessions this month
      prisma.practiceSession.count({ where: { startedAt: { gte: startOfMonth } } }),

      // Total questions
      prisma.question.count(),

      // Questions by part
      prisma.question.groupBy({
        by: ['partNumber'],
        _count: { id: true },
        orderBy: { partNumber: 'asc' },
      }),

      // Token package sales distribution (paid only)
      prisma.payment.groupBy({
        by: ['tokenAmount'],
        where: { status: 'PAID', tokenAmount: { not: null } },
        _count: { id: true },
        _sum: { amount: true },
      }),

      // Revenue per day (last 30 days, paid only)
      prisma.payment.findMany({
        where: { status: 'PAID', paidAt: { gte: thirtyDaysAgo } },
        select: { amount: true, paidAt: true },
        orderBy: { paidAt: 'asc' },
      }),

      // Sessions per day (last 30 days)
      prisma.practiceSession.findMany({
        where: { startedAt: { gte: thirtyDaysAgo } },
        select: { startedAt: true },
        orderBy: { startedAt: 'asc' },
      }),

      // Recent paid payments
      prisma.payment.findMany({
        where: { status: 'PAID' },
        orderBy: { paidAt: 'desc' },
        take: 10,
        select: {
          id: true,
          amount: true,
          tokenAmount: true,
          paidAt: true,
          user: { select: { email: true, fullName: true } },
        },
      }),
    ])

    // Build day-by-day map for last 30 days
    const days: string[] = []
    for (let i = 29; i >= 0; i--) {
      days.push(formatDay(subDays(now, i)))
    }

    const revenueMap = new Map<string, number>()
    for (const p of revenueByDay) {
      if (!p.paidAt) continue
      const key = formatDay(p.paidAt)
      revenueMap.set(key, (revenueMap.get(key) ?? 0) + p.amount)
    }

    const sessionMap = new Map<string, number>()
    for (const s of sessionsByDay) {
      const key = formatDay(s.startedAt)
      sessionMap.set(key, (sessionMap.get(key) ?? 0) + 1)
    }

    const revenueSeries = days.map((d) => ({ date: d, revenue: revenueMap.get(d) ?? 0 }))
    const sessionSeries = days.map((d) => ({ date: d, count: sessionMap.get(d) ?? 0 }))

    return {
      overview: {
        totalUsers,
        newUsersThisMonth,
        totalRevenue: totalPaidPayments._sum.amount ?? 0,
        revenueThisMonth: revenueThisMonth._sum.amount ?? 0,
        totalPayments: totalPaidPayments._count.id,
        totalSessions,
        sessionsThisMonth,
        totalQuestions,
      },
      questionsByPart: questionsByPart.map((q) => ({
        part: `Part ${q.partNumber}`,
        count: q._count.id,
      })),
      tokenPackageStats: tokenPackageStats.map((t) => ({
        tokens: t.tokenAmount ?? 0,
        label: `${t.tokenAmount} token`,
        count: t._count.id,
        totalRevenue: t._sum.amount ?? 0,
      })),
      revenueSeries,
      sessionSeries,
      recentPayments: recentPayments.map((p) => ({
        id: p.id,
        amount: p.amount,
        tokenAmount: p.tokenAmount,
        paidAt: p.paidAt,
        userEmail: p.user.email,
        userFullName: p.user.fullName,
      })),
    }
  }
}

import { useMemo } from 'react'
import { Flex, Tooltip, Typography } from 'antd'
import { COLORS } from '@/shared/constants/user-color'
import { hexToRgba } from '@/shared/utils/color'

const { Text } = Typography

const WEEKS = 13 // 3 months ≈ 13 weeks
const DAYS = 7
const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', '']
const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

// Color levels using primary color with different opacities
const LEVELS = [
  hexToRgba(COLORS.primary, 0.1), // Level 0: Very light
  hexToRgba(COLORS.primary, 0.3), // Level 1: Light
  hexToRgba(COLORS.primary, 0.5), // Level 2: Medium
  hexToRgba(COLORS.primary, 0.7), // Level 3: Dark
  COLORS.primary, // Level 4: Full color
]
const LABEL_COLOR = '#57606a'

const CELL_WIDTH = 40
const CELL_HEIGHT = 25
const GAP = 3

function getLevel(count: number): number {
  if (count === 0) return 0
  if (count <= 1) return 1
  if (count <= 3) return 2
  if (count <= 6) return 3
  return 4
}

function buildGrid(activityByDate: Map<string, number>) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const start = new Date(today)
  start.setDate(start.getDate() - today.getDay() - WEEKS * 7)

  const grid: { date: Date; count: number }[][] = []

  for (let w = 0; w <= WEEKS; w++) {
    const week: { date: Date; count: number }[] = []
    for (let d = 0; d < DAYS; d++) {
      const date = new Date(start)
      date.setDate(start.getDate() + w * 7 + d)
      if (date > today) break
      const key = date.toISOString().slice(0, 10)
      week.push({ date, count: activityByDate.get(key) ?? 0 })
    }
    if (week.length) grid.push(week)
  }
  return grid
}

function getMonthHeaders(grid: { date: Date; count: number }[][]) {
  const headers: { label: string; colIdx: number }[] = []
  let lastMonth = -1
  grid.forEach((week, i) => {
    const month = week[0].date.getMonth()
    if (month !== lastMonth) {
      headers.push({ label: MONTH_LABELS[month], colIdx: i })
      lastMonth = month
    }
  })
  return headers
}

export interface HeatmapProps {
  activityByDate?: Map<string, number>
}

export function Heatmap({ activityByDate = new Map() }: HeatmapProps) {
  const grid = useMemo(() => buildGrid(activityByDate), [activityByDate])
  const monthHeaders = useMemo(() => getMonthHeaders(grid), [grid])

  const totalWidth = grid.length * (CELL_WIDTH + GAP)

  return (
    <div style={{ display: 'inline-block' }}>
      {/* Month labels */}
      <div
        style={{
          display: 'flex',
          marginLeft: 32,
          marginBottom: 22,
          position: 'relative',
          width: totalWidth,
        }}
      >
        {monthHeaders.map(({ label, colIdx }) => (
          <span
            key={`${label}-${colIdx}`}
            style={{
              position: 'absolute',
              left: colIdx * (CELL_WIDTH + GAP),
              color: LABEL_COLOR,
              fontSize: 11,
              fontFamily: 'monospace',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </span>
        ))}
      </div>

      {/* Day labels + grid */}
      <div style={{ display: 'flex', gap: 4 }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: GAP,
            marginRight: 4,
            paddingTop: 2,
          }}
        >
          {DAY_LABELS.map((label, i) => (
            <div
              key={i}
              style={{
                height: CELL_HEIGHT,
                color: LABEL_COLOR,
                fontSize: 10,
                fontFamily: 'monospace',
                display: 'flex',
                alignItems: 'center',
                width: 24,
                justifyContent: 'flex-end',
              }}
            >
              {label}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: GAP }}>
          {grid.map((week, wi) => (
            <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>
              {week.map(({ date, count }, di) => {
                const dateStr = date.toLocaleDateString('vi-VN', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
                return (
                  <Tooltip
                    key={di}
                    title={
                      count > 0
                        ? `${count} lần luyện tập · ${dateStr}`
                        : `Chưa có hoạt động · ${dateStr}`
                    }
                    placement="top"
                  >
                    <div
                      style={{
                        width: CELL_WIDTH,
                        height: CELL_HEIGHT,
                        borderRadius: 2,
                        backgroundColor: LEVELS[getLevel(count)],
                        cursor: 'default',
                        flexShrink: 0,
                      }}
                    />
                  </Tooltip>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <Flex align="center" gap={6} justify="flex-end" style={{ marginTop: 10 }}>
        <Text style={{ color: LABEL_COLOR, fontSize: 11 }}>Less</Text>
        {LEVELS.map((color, i) => (
          <div
            key={i}
            style={{
              width: CELL_WIDTH,
              height: CELL_HEIGHT,
              borderRadius: 2,
              backgroundColor: color,
            }}
          />
        ))}
        <Text style={{ color: LABEL_COLOR, fontSize: 11 }}>More</Text>
      </Flex>
    </div>
  )
}

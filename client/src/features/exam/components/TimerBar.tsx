import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'

dayjs.extend(duration)

export function TimerBar({
  label,
  seconds,
}: {
  label: 'PREPARATION TIME' | 'RESPONSE TIME'
  seconds: number
}) {
  const display = dayjs.duration(Math.max(0, seconds), 'seconds').format('HH:mm:ss')

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#1a1a1a',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '10px 40px',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
        <span
          style={{
            color: '#bbb',
            fontSize: 11,
            letterSpacing: 3,
            fontFamily: '"Courier New", monospace',
            textTransform: 'uppercase',
          }}
        >
          {label}
        </span>
        <span
          style={{
            color: '#fff',
            fontSize: 32,
            fontFamily: '"Courier New", monospace',
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1.1,
          }}
        >
          {display}
        </span>
      </div>
    </div>
  )
}

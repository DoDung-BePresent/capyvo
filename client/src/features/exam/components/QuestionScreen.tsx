import { Image } from 'antd'

import type { Phase } from './exam-phases'
import { TimerBar } from './TimerBar'
import { MicWaveform } from './MicWaveform'

export type TimerPhase = Extract<
  Phase,
  { kind: 'prep_signal' | 'prep' | 'response_signal' | 'response' }
>

// TimerBar height is ~68px; waveform strip is 72px
const TIMER_BAR_HEIGHT = 68

export function QuestionScreen({
  phase,
  seconds,
  recordingStream,
}: {
  phase: TimerPhase
  seconds: number
  recordingStream?: MediaStream | null
}) {
  const { question } = phase
  const label =
    phase.kind === 'prep' || phase.kind === 'prep_signal' ? 'PREPARATION TIME' : 'RESPONSE TIME'

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: `60px 80px ${TIMER_BAR_HEIGHT + (recordingStream ? 72 : 0) + 16}px`,
      }}
    >
      <div style={{ maxWidth: 820, width: '100%' }}>
        {question.contentText && (
          <p style={{ fontSize: 18, lineHeight: 2.1, color: '#1a1a1a', margin: 0 }}>
            {question.contentText}
          </p>
        )}

        {question.imageUrls?.[0] && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <Image
              src={question.imageUrls[0]}
              style={{ maxHeight: 380, objectFit: 'contain' }}
              preview={false}
            />
          </div>
        )}

        {question.contextText && (
          <p
            style={{
              fontSize: 18,
              lineHeight: 2.1,
              color: '#1a1a1a',
              marginBottom: question.questionText ? 24 : 0,
            }}
          >
            {question.contextText}
          </p>
        )}

        {question.questionText && (
          <p style={{ fontSize: 18, lineHeight: 2.1, color: '#1a1a1a', marginTop: 24 }}>
            {question.questionText}
          </p>
        )}
      </div>

      {/* Waveform strip above TimerBar */}
      {recordingStream && (
        <div
          style={{
            position: 'fixed',
            bottom: TIMER_BAR_HEIGHT,
            left: 0,
            right: 0,
            backgroundColor: '#111',
            padding: '8px 40px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#ff4d4f',
              flexShrink: 0,
            }}
            className="animate-pulse"
          />
          <div className="w-60">
            <MicWaveform stream={recordingStream} height={40} />
          </div>
        </div>
      )}

      <TimerBar label={label} seconds={seconds} />
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import WaveSurfer from 'wavesurfer.js'
import { Button, Spin } from 'antd'
import { PauseOutlined, CaretRightOutlined } from '@ant-design/icons'

interface WavesurferPlayerProps {
  url: string
}

export function WavesurferPlayer({ url }: WavesurferPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WaveSurfer | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)

  useEffect(() => {
    if (!containerRef.current) return

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#d1d5db',
      progressColor: '#1677FF',
      cursorColor: 'transparent',
      barWidth: 2,
      barGap: 2,
      barRadius: 2,
      height: 40,
      normalize: true,
      interact: true,
    })

    wsRef.current = ws

    ws.on('ready', () => {
      setIsLoading(false)
      setDuration(ws.getDuration())
    })
    ws.on('play', () => setIsPlaying(true))
    ws.on('pause', () => setIsPlaying(false))
    ws.on('finish', () => setIsPlaying(false))
    ws.on('timeupdate', (t) => setCurrentTime(t))

    ws.load(url)

    return () => {
      ws.destroy()
      wsRef.current = null
    }
  }, [url])

  const togglePlay = () => wsRef.current?.playPause()

  const fmt = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}:${String(s).padStart(2, '0')}`
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
      <Button
        type="primary"
        shape="circle"
        icon={isPlaying ? <PauseOutlined /> : <CaretRightOutlined />}
        onClick={togglePlay}
        disabled={isLoading}
        style={{ flexShrink: 0 }}
      />

      <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
        {isLoading && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1,
            }}
          >
            <Spin size="small" />
          </div>
        )}
        <div ref={containerRef} style={{ opacity: isLoading ? 0 : 1 }} />
      </div>

      <span
        style={{
          fontSize: 12,
          color: '#6b7280',
          flexShrink: 0,
          fontVariantNumeric: 'tabular-nums',
          fontFamily: 'monospace',
        }}
      >
        {fmt(currentTime)} / {fmt(duration)}
      </span>
    </div>
  )
}

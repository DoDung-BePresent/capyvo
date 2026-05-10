import { useEffect, useRef, useState } from 'react'
import { Flex } from 'antd'
import { PlayCircleOutlined, PauseCircleOutlined } from '@ant-design/icons'
import { styled } from '@/shared/utils/cn'

const Button = styled(
  'button',
  'relative inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors cursor-pointer border-0',
)

interface WaveformVisualizerProps {
  audioUrl: string
}

export function WaveformVisualizer({ audioUrl }: WaveformVisualizerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const waveformRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [bars] = useState(() => {
    // Generate random waveform bars once
    return Array.from({ length: 60 }, () => {
      // Random heights between 20% and 90%
      return Math.random() * 70 + 20
    })
  })

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateProgress = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100)
      }
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setProgress(0)
    }

    audio.addEventListener('timeupdate', updateProgress)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', updateProgress)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    const waveform = waveformRef.current
    if (!audio || !waveform) return

    const rect = waveform.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percentage = clickX / rect.width

    audio.currentTime = percentage * audio.duration
    setProgress(percentage * 100)
  }

  return (
    <Flex align="center" gap={12} style={{ width: '100%' }}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Play/Pause Button */}
      <Button onClick={togglePlay}>
        {isPlaying ? (
          <PauseCircleOutlined style={{ fontSize: 20, color: '#1890ff' }} />
        ) : (
          <PlayCircleOutlined style={{ fontSize: 20, color: '#1890ff' }} />
        )}
      </Button>

      {/* Waveform */}
      <div
        ref={waveformRef}
        onClick={handleWaveformClick}
        style={{
          flex: 1,
          height: 45,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          overflow: 'hidden',
          cursor: 'pointer',
        }}
      >
        {bars.map((height, index) => {
          const isPassed = (index / bars.length) * 100 < progress
          return (
            <div
              key={index}
              style={{
                flex: 1,
                height: `${height}%`,
                backgroundColor: isPassed ? '#1890ff' : '#d9d9d9',
                borderRadius: 2,
                transition: 'background-color 0.2s',
              }}
            />
          )
        })}
      </div>
    </Flex>
  )
}

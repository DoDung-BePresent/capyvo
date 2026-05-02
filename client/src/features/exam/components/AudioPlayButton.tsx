import { useState, useRef, useEffect } from 'react'
import { VolumeUp } from '@mui/icons-material'
import { styled } from '@/shared/utils/cn'

const Button = styled(
  'button',
  'relative inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors cursor-pointer border-0',
)

const WaveContainer = styled('div', 'absolute inset-0 flex items-center justify-center gap-0.5')

const WaveBar = styled('div', 'w-0.5 bg-blue-500 rounded-full transition-all duration-150')

interface AudioPlayButtonProps {
  audioUrl: string
  onClick?: (e: React.MouseEvent) => void
}

export function AudioPlayButton({ audioUrl, onClick }: AudioPlayButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Create audio element
    const audio = new Audio(audioUrl)
    audioRef.current = audio

    audio.onended = () => setIsPlaying(false)
    audio.onerror = () => setIsPlaying(false)

    return () => {
      audio.pause()
      audio.src = ''
    }
  }, [audioUrl])

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClick?.(e)

    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsPlaying(false)
    } else {
      audioRef.current.play().catch((error) => {
        console.log('Play failed:', error)
        setIsPlaying(false)
      })
      setIsPlaying(true)
    }
  }

  return (
    <Button onClick={handleClick}>
      {isPlaying ? (
        <WaveContainer>
          {[...Array(4)].map((_, i) => (
            <WaveBar
              key={i}
              style={{
                height: '60%',
                animation: `wave 0.6s ease-in-out infinite`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
          <style>{`
            @keyframes wave {
              0%, 100% { height: 30%; }
              50% { height: 70%; }
            }
          `}</style>
        </WaveContainer>
      ) : (
        <VolumeUp style={{ fontSize: 20, color: '#1890ff' }} />
      )}
    </Button>
  )
}

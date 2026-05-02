import { useEffect, useRef } from 'react'

export interface MicWaveformProps {
  stream: MediaStream
  height?: number
  color?: string
  barWidth?: number
  barGap?: number
}

export function MicWaveform({
  stream,
  height = 80,
  color = '#ff4d4f',
  barWidth = 4,
  barGap = 6,
}: MicWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const audioCtx = new AudioContext()
    const analyser = audioCtx.createAnalyser()
    analyser.fftSize = 256
    analyser.smoothingTimeConstant = 0.8

    const source = audioCtx.createMediaStreamSource(stream)
    source.connect(analyser)

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    let animId: number

    function draw() {
      animId = requestAnimationFrame(draw)
      analyser.getByteTimeDomainData(dataArray)

      if (!canvas) return
      const ctx = canvas.getContext('2d')!
      const W = canvas.width
      const H = canvas.height
      const midY = H / 2

      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = color

      const step = barWidth + barGap
      const count = Math.floor(W / step)
      const sliceSize = Math.max(1, Math.floor(bufferLength / count))

      for (let i = 0; i < count; i++) {
        let maxDev = 0
        for (let j = 0; j < sliceSize; j++) {
          const v = dataArray[i * sliceSize + j] ?? 128
          const dev = Math.abs(v - 128)
          if (dev > maxDev) maxDev = dev
        }

        // 128 = silence → amplitude 0, bars are just a thin line
        const amplitude = maxDev / 128
        const barH = Math.max(8, Math.pow(amplitude, 0.6) * H * 0.7)

        const x = i * step
        const radius = barWidth / 2

        // Draw rounded rectangle
        ctx.beginPath()
        ctx.roundRect(x, midY - barH / 2, barWidth, barH, radius)
        ctx.fill()
      }
    }

    draw()

    return () => {
      cancelAnimationFrame(animId)
      source.disconnect()
      audioCtx.close()
    }
  }, [stream, height, color, barWidth, barGap])

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: `${height}px`,
      }}
    >
      <canvas
        ref={canvasRef}
        width={300}
        height={height}
        style={{ width: '300px', height: `${height}px`, display: 'block' }}
      />
    </div>
  )
}

import { useEffect, useRef } from 'react'

export interface MicWaveformProps {
  stream: MediaStream
  height?: number
  color?: string
  barWidth?: number
  barGap?: number
  barRadius?: number
  noiseThreshold?: number
}

export function MicWaveform({
  stream,
  height = 56,
  color = '#818cf8',
  barWidth = 4,
  barGap = 2,
  barRadius = 2,
  noiseThreshold = 12,
}: MicWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const audioCtx = new AudioContext()
    const analyser = audioCtx.createAnalyser()
    analyser.fftSize = 256
    analyser.smoothingTimeConstant = 0.75

    const source = audioCtx.createMediaStreamSource(stream)
    source.connect(analyser)

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    let animId: number

    function draw() {
      animId = requestAnimationFrame(draw)
      analyser.getByteFrequencyData(dataArray)

      if (!canvas) return
      const ctx = canvas.getContext('2d')!
      const W = canvas.width
      const H = canvas.height

      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = color

      const step = barWidth + barGap
      const count = Math.floor(W / step)
      const sliceSize = Math.max(1, Math.floor(bufferLength / count))

      for (let i = 0; i < count; i++) {
        let sum = 0
        for (let j = 0; j < sliceSize; j++) {
          sum += dataArray[i * sliceSize + j] ?? 0
        }
        const avg = sum / sliceSize

        // below noiseThreshold → treat as silence (no bar)
        const amplitude = avg < noiseThreshold ? 0 : avg / 255
        const barH = Math.max(2 * (amplitude > 0 ? 1 : 0), amplitude * H)

        if (barH === 0) continue

        const x = i * step
        const y = (H - barH) / 2

        ctx.beginPath()
        ctx.roundRect(x, y, barWidth, barH, barRadius)
        ctx.fill()
      }
    }

    draw()

    return () => {
      cancelAnimationFrame(animId)
      source.disconnect()
      audioCtx.close()
    }
  }, [stream, height, color, barWidth, barGap, barRadius, noiseThreshold])

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={height}
      style={{ width: '100%', height: `${height}px`, display: 'block' }}
    />
  )
}

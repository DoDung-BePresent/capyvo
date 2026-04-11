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
  height = 106,
  color = '#818cf8',
  barWidth = 18,
  barGap = 10,
}: MicWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const audioCtx = new AudioContext()
    const analyser = audioCtx.createAnalyser()
    analyser.fftSize = 1024
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
        const barH = Math.max(3, Math.pow(amplitude, 0.5) * H * 0.9)

        const x = i * step
        ctx.beginPath()
        ctx.roundRect(x, midY - barH / 2, barWidth, barH, 2)
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
    <canvas
      ref={canvasRef}
      width={800}
      height={height}
      style={{ width: '100%', height: `${height}px`, display: 'block' }}
    />
  )
}

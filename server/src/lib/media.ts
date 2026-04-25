import sharp from 'sharp'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import { Readable, PassThrough } from 'stream'

ffmpeg.setFfmpegPath(ffmpegInstaller.path)

// ─── Image ────────────────────────────────────────────────────────────────────

/** Resize to fit within 1920×1920, convert to WebP @85. Returns new buffer + mime. */
export async function optimizeImage(
  buffer: Buffer,
): Promise<{ data: Buffer; contentType: string; ext: string }> {
  const data = await sharp(buffer)
    .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer()
  return { data, contentType: 'image/webp', ext: 'webp' }
}

// ─── Audio ────────────────────────────────────────────────────────────────────

const MIME_TO_FORMAT: Record<string, string> = {
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/mp4': 'mp4',
  'audio/m4a': 'mp4',
  'audio/x-m4a': 'mp4',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/ogg': 'ogg',
  'audio/webm': 'webm',
  'audio/aac': 'aac',
  'audio/flac': 'flac',
}

/**
 * Re-encode to MP3 128kbps mono — good quality for speech, ~1 MB/min.
 * Already-MP3 files are still re-encoded to normalise bitrate.
 */
export function compressAudio(buffer: Buffer, mimeType: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const inputFormat = MIME_TO_FORMAT[mimeType.toLowerCase()] ?? 'mp3'

    const input = new Readable({
      read() {
        this.push(buffer)
        this.push(null)
      },
    })

    const output = new PassThrough()
    const chunks: Buffer[] = []
    output.on('data', (chunk: Buffer) => chunks.push(chunk))
    output.on('end', () => resolve(Buffer.concat(chunks)))
    output.on('error', reject)

    ffmpeg(input)
      .inputFormat(inputFormat)
      .noVideo()
      .audioCodec('libmp3lame')
      .audioBitrate('128k')
      .audioChannels(1)
      .audioFrequency(44100)
      .format('mp3')
      .on('error', reject)
      .pipe(output)
  })
}

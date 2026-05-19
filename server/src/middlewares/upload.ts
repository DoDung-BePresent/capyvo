import multer from 'multer'
import crypto from 'crypto'
import { ValidationError } from '@/errors/app-error'

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_AUDIO_SIZE = 20 * 1024 * 1024 // 20MB

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const ALLOWED_AUDIO_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/webm',
  'audio/ogg',
  'audio/mp4',
  'audio/m4a',
  'audio/x-m4a',
  'audio/aac',
  'audio/flac',
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Generate unique filename with timestamp and UUID
 * Format: {timestamp}-{uuid}.{ext}
 * Example: 1704067200000-a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg
 */
function generateFilename(originalName: string, extension?: string): string {
  const timestamp = Date.now()
  const uuid = crypto.randomUUID()

  // Extract extension from original name if not provided
  const ext = extension || originalName.split('.').pop()?.toLowerCase() || 'bin'

  return `${timestamp}-${uuid}.${ext}`
}

/**
 * Validate file type against allowed types
 */
function validateFileType(mimetype: string, allowedTypes: string[]): boolean {
  return allowedTypes.includes(mimetype.toLowerCase())
}

// ─── Image Upload Middleware ──────────────────────────────────────────────────

/**
 * Multer middleware for image uploads
 * - Max size: 5MB
 * - Allowed types: JPEG, PNG, WebP
 * - Storage: Memory (for compression before upload)
 * - Filename: Auto-generated with timestamp + UUID
 */
export const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_IMAGE_SIZE,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    // Validate file type
    if (!validateFileType(file.mimetype, ALLOWED_IMAGE_TYPES)) {
      cb(
        new ValidationError(
          `Invalid image type: ${file.mimetype}. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`,
        ),
      )
      return
    }

    // Generate new filename
    file.originalname = generateFilename(file.originalname, 'webp') // Will be converted to WebP

    cb(null, true)
  },
})

// ─── Audio Upload Middleware ──────────────────────────────────────────────────

/**
 * Multer middleware for audio uploads
 * - Max size: 20MB
 * - Allowed types: MP3, WAV, WebM, OGG, M4A, AAC, FLAC
 * - Storage: Memory (for compression before upload)
 * - Filename: Auto-generated with timestamp + UUID
 */
export const uploadAudio = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_AUDIO_SIZE,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    // Validate file type
    if (!validateFileType(file.mimetype, ALLOWED_AUDIO_TYPES)) {
      cb(
        new ValidationError(
          `Invalid audio type: ${file.mimetype}. Allowed types: ${ALLOWED_AUDIO_TYPES.join(', ')}`,
        ),
      )
      return
    }

    // Generate new filename
    file.originalname = generateFilename(file.originalname, 'mp3') // Will be converted to MP3

    cb(null, true)
  },
})

// ─── Export Constants for Reference ──────────────────────────────────────────

export const UPLOAD_LIMITS = {
  IMAGE_MAX_SIZE: MAX_IMAGE_SIZE,
  AUDIO_MAX_SIZE: MAX_AUDIO_SIZE,
  IMAGE_MAX_SIZE_MB: MAX_IMAGE_SIZE / (1024 * 1024),
  AUDIO_MAX_SIZE_MB: MAX_AUDIO_SIZE / (1024 * 1024),
} as const

export const ALLOWED_TYPES = {
  IMAGE: ALLOWED_IMAGE_TYPES,
  AUDIO: ALLOWED_AUDIO_TYPES,
} as const

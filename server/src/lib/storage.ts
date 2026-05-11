import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Railway Bucket is S3-compatible
const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env['STORAGE_ENDPOINT'], // Railway will provide this
  credentials: {
    accessKeyId: process.env['STORAGE_ACCESS_KEY_ID'] || '',
    secretAccessKey: process.env['STORAGE_SECRET_ACCESS_KEY'] || '',
  },
})

const BUCKET_NAME = process.env['STORAGE_BUCKET_NAME'] || 'capyvo'

export class StorageService {
  /**
   * Upload file to storage
   */
  async upload(path: string, file: Buffer, contentType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: path,
      Body: file,
      ContentType: contentType,
    })

    await s3Client.send(command)

    // Return public URL
    return `${process.env['STORAGE_PUBLIC_URL']}/${path}`
  }

  /**
   * Get signed URL for private file access
   */
  async getSignedUrl(path: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: path,
    })

    return await getSignedUrl(s3Client, command, { expiresIn })
  }

  /**
   * Delete file from storage
   */
  async delete(path: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: path,
    })

    await s3Client.send(command)
  }

  /**
   * Get public URL for file
   */
  getPublicUrl(path: string): string {
    return `${process.env['STORAGE_PUBLIC_URL']}/${path}`
  }
}

export const storage = new StorageService()

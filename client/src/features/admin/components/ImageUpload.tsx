import { useState } from 'react'
import { message } from 'antd'
import type { UploadRequestOption } from '@rc-component/upload/lib/interface'
import axiosInstance from '@/lib/axios'
import type { ApiResponse } from '@/shared/types/api'
import { ImageDragger } from '@/shared/components/ImageDragger'

interface Props {
  value?: string
  onChange?: (url: string | undefined) => void
  accept?: string
  hintText?: string
}

export default function ImageUpload({ value, onChange, accept = 'image/*', hintText }: Props) {
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (options: UploadRequestOption) => {
    const file = options.file as File
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      const { data } = await axiosInstance.post<ApiResponse<{ url: string }>>(
        '/questions/upload/image',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      )
      onChange?.(data.data.url)
      message.success('Tải ảnh thành công')
      options.onSuccess?.({})
    } catch {
      message.error('Tải ảnh thất bại')
      options.onError?.(new Error('Upload failed'))
    } finally {
      setUploading(false)
    }
  }

  return (
    <ImageDragger
      previewUrl={value}
      hintText={hintText}
      uploadProps={{
        customRequest: handleUpload,
        showUploadList: false,
        accept,
        maxCount: 1,
        disabled: uploading,
      }}
    />
  )
}

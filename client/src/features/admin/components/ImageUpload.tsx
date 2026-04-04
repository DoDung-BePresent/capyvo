import { useState } from 'react'
import { Upload, Button, Image, message, Space, Typography } from 'antd'
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons'
import type { UploadRequestOption } from '@rc-component/upload/lib/interface'
import axiosInstance from '@/lib/axios'
import type { ApiResponse } from '@/shared/types/api'

const { Text } = Typography

interface Props {
  value?: string
  onChange?: (url: string | undefined) => void
  accept?: string
}

export default function ImageUpload({ value, onChange, accept = 'image/*' }: Props) {
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
    <Space direction="vertical" size={8}>
      <Upload customRequest={handleUpload} showUploadList={false} accept={accept} maxCount={1}>
        <Button icon={<UploadOutlined />} loading={uploading}>
          {value ? 'Thay ảnh' : 'Chọn ảnh'}
        </Button>
      </Upload>

      {value && (
        <Space align="start">
          <Image src={value} height={120} style={{ objectFit: 'cover', borderRadius: 4 }} />
          <Button
            type="text"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => onChange?.(undefined)}
          />
        </Space>
      )}

      {!value && (
        <Text type="secondary" style={{ fontSize: 12 }}>
          Ảnh sẽ được lưu vào Supabase Storage
        </Text>
      )}
    </Space>
  )
}

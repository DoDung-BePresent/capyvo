import { useState } from 'react'
import { message, Segmented, Space, Typography, Upload } from 'antd'
import { AudioOutlined, RobotOutlined, UploadOutlined } from '@ant-design/icons'
import type { UploadRequestOption } from '@rc-component/upload/lib/interface'
import axiosInstance from '@/lib/axios'
import type { ApiResponse } from '@/shared/types/api'

const { Text } = Typography

type AudioMode = 'upload' | 'ai'

interface Props {
  value?: string
  onChange?: (url: string | undefined) => void
}

export default function AudioUploadField({ value, onChange }: Props) {
  const [mode, setMode] = useState<AudioMode>('upload')
  const [uploading, setUploading] = useState(false)

  function handleModeChange(newMode: AudioMode) {
    setMode(newMode)
    if (newMode === 'ai') onChange?.(undefined)
  }

  async function handleUpload(options: UploadRequestOption) {
    const file = options.file as File
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('audio', file)
      const { data } = await axiosInstance.post<ApiResponse<{ url: string }>>(
        '/questions/upload/audio',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      )
      onChange?.(data.data.url)
      message.success('Tải audio thành công')
      options.onSuccess?.({})
    } catch {
      message.error('Tải audio thất bại')
      options.onError?.(new Error('Upload failed'))
    } finally {
      setUploading(false)
    }
  }

  return (
    <Space direction="vertical" size={8} style={{ width: '100%' }}>
      <Segmented
        size="small"
        value={mode}
        onChange={(v) => handleModeChange(v as AudioMode)}
        options={[
          { value: 'upload', icon: <UploadOutlined />, label: 'Tự upload' },
          { value: 'ai', icon: <RobotOutlined />, label: 'AI tạo từ text' },
        ]}
      />

      {mode === 'upload' && (
        <Upload.Dragger
          customRequest={handleUpload}
          showUploadList={false}
          accept="audio/*"
          maxCount={1}
          disabled={uploading}
          style={{ padding: '8px 0' }}
        >
          {value ? (
            <div style={{ padding: '4px 12px' }} onClick={(e) => e.stopPropagation()}>
              <audio controls src={value} style={{ width: '100%', height: 36 }} />
              <Text type="secondary" style={{ fontSize: 11 }}>
                Click hoặc kéo thả để thay thế
              </Text>
            </div>
          ) : (
            <>
              <p style={{ margin: '4px 0' }}>
                <AudioOutlined style={{ fontSize: 20, color: '#1677ff' }} />
              </p>
              <p style={{ margin: '2px 0', fontSize: 13 }}>Click hoặc kéo thả file audio</p>
              <p style={{ margin: '2px 0', fontSize: 11, color: '#888' }}>
                MP3, M4A, WAV, OGG... tối đa 20MB
              </p>
            </>
          )}
        </Upload.Dragger>
      )}

      {mode === 'ai' && (
        <div
          style={{
            padding: '8px 12px',
            background: 'var(--ant-color-fill-quaternary)',
            borderRadius: 6,
            fontSize: 12,
            color: '#888',
          }}
        >
          <RobotOutlined style={{ marginRight: 6 }} />
          Audio sẽ được AI tạo tự động từ nội dung text khi lưu.
        </div>
      )}
    </Space>
  )
}

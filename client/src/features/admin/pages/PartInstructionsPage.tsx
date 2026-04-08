import { useRef } from 'react'
import { Button, Card, Flex, Skeleton, Space, Tag, Typography, Upload } from 'antd'
import { SoundOutlined, UploadOutlined } from '@ant-design/icons'

import { PageHeader } from '@/shared/components'
import { PART_META } from '../types'
import { useGetInstructions, useUploadInstructionAudio } from '../hooks/useInstruction'
import type { PartInstruction } from '../types'

const { Text } = Typography

type PartKey = 1 | 2 | 3 | 4 | 5

// ─── Single part row ─── //
function PartRow({
  partNumber,
  instruction,
}: {
  partNumber: PartKey
  instruction: PartInstruction | undefined
}) {
  const meta = PART_META[partNumber]
  const { mutate: uploadAudio, isPending } = useUploadInstructionAudio(partNumber)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (file: File) => {
    uploadAudio(file)
  }

  return (
    <Flex
      align="center"
      gap={16}
      style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0' }}
    >
      <Tag
        style={{
          minWidth: 64,
          textAlign: 'center',
          fontWeight: 600,
          borderColor: meta.color,
          color: meta.color,
          backgroundColor: `${meta.color}18`,
          fontSize: 13,
        }}
      >
        {meta.label}
      </Tag>

      <Space direction="vertical" size={2} style={{ flex: 1 }}>
        <Text>{meta.description}</Text>
        {instruction?.audioUrl ? (
          <Flex align="center" gap={8}>
            <SoundOutlined style={{ color: '#52c41a' }} />
            <a href={instruction.audioUrl} target="_blank" rel="noreferrer">
              Nghe audio hiện tại
            </a>
            <Text type="secondary" style={{ fontSize: 12 }}>
              · Cập nhật: {new Date(instruction.updatedAt).toLocaleDateString('vi-VN')}
            </Text>
          </Flex>
        ) : (
          <Text type="secondary" style={{ fontStyle: 'italic' }}>
            Chưa có audio
          </Text>
        )}
      </Space>

      <Upload
        accept="audio/*"
        showUploadList={false}
        beforeUpload={(file) => {
          handleFileChange(file)
          return false
        }}
      >
        <Button icon={<UploadOutlined />} loading={isPending}>
          {instruction?.audioUrl ? 'Thay audio' : 'Tải lên'}
        </Button>
      </Upload>

      {/* hidden native input ref kept for future programmatic access */}
      <input ref={inputRef} type="file" accept="audio/*" style={{ display: 'none' }} />
    </Flex>
  )
}

// ─── Page ─── //
export default function PartInstructionsPage() {
  const { data: instructions = [], isLoading } = useGetInstructions()

  const instructionMap = new Map(instructions.map((i) => [i.partNumber, i]))

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <PageHeader
        title="Cấu hình giọng đọc"
        description="Upload audio hướng dẫn (instruction) cho từng phần thi"
        breadcrumbs={[{ label: 'Cấu hình giọng đọc' }]}
      />

      <Card styles={{ body: { padding: 0 } }}>
        {isLoading ? (
          <div style={{ padding: 24 }}>
            <Skeleton active />
          </div>
        ) : (
          ([1, 2, 3, 4, 5] as PartKey[]).map((partNumber) => (
            <PartRow
              key={partNumber}
              partNumber={partNumber}
              instruction={instructionMap.get(partNumber)}
            />
          ))
        )}
      </Card>
    </Space>
  )
}

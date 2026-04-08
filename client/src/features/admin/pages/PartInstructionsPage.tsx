import { useRef } from 'react'
import { Button, Card, Flex, Skeleton, Space, Tag, Typography, Upload } from 'antd'
import { SoundOutlined, UploadOutlined } from '@ant-design/icons'

import { PageHeader } from '@/shared/components'
import { PART_META, SYSTEM_AUDIO_META } from '../types'
import type { PartInstruction, SystemAudio, SystemAudioKey } from '../types'
import { useGetInstructions, useUploadInstructionAudio } from '../hooks/useInstruction'
import { useGetSystemAudio, useUploadSystemAudio } from '../hooks/useSystemAudio'

const { Text } = Typography

type PartKey = 1 | 2 | 3 | 4 | 5

// ─── Signal row ─── //
function SignalRow({
  audioKey,
  item,
}: {
  audioKey: SystemAudioKey
  item: SystemAudio | undefined
}) {
  const meta = SYSTEM_AUDIO_META[audioKey]
  const { mutate: uploadAudio, isPending } = useUploadSystemAudio(audioKey)

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
          borderColor: '#722ed1',
          color: '#722ed1',
          backgroundColor: '#722ed118',
          fontSize: 13,
        }}
      >
        Tín hiệu
      </Tag>

      <Space direction="vertical" size={2} style={{ flex: 1 }}>
        <Text strong>{meta.label}</Text>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {meta.description}
        </Text>
        {item?.audioUrl ? (
          <Flex align="center" gap={8}>
            <SoundOutlined style={{ color: '#52c41a' }} />
            <a href={item.audioUrl} target="_blank" rel="noreferrer">
              Nghe audio hiện tại
            </a>
            <Text type="secondary" style={{ fontSize: 12 }}>
              · Cập nhật: {new Date(item.updatedAt).toLocaleDateString('vi-VN')}
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
          uploadAudio(file)
          return false
        }}
      >
        <Button icon={<UploadOutlined />} loading={isPending}>
          {item?.audioUrl ? 'Thay audio' : 'Tải lên'}
        </Button>
      </Upload>
    </Flex>
  )
}

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
  const { data: instructions = [], isLoading: loadingInstructions } = useGetInstructions()
  const { data: signals = [], isLoading: loadingSignals } = useGetSystemAudio()

  const instructionMap = new Map(instructions.map((i) => [i.partNumber, i]))
  const signalMap = new Map(signals.map((s) => [s.key, s]))

  const isLoading = loadingInstructions || loadingSignals

  return (
    <Space vertical size={0} style={{ width: '100%' }}>
      <PageHeader
        title="Cấu hình giọng đọc"
        description="Upload audio hướng dẫn và tín hiệu cho từng phần thi"
        breadcrumbs={[{ label: 'Cấu hình giọng đọc' }]}
      />
      <Space vertical size={24} style={{ width: '100%' }}>
        <Card title="Tín hiệu hệ thống" styles={{ body: { padding: 0 } }}>
          {isLoading ? (
            <div style={{ padding: 24 }}>
              <Skeleton active />
            </div>
          ) : (
            (['START_SPEAKING', 'START_RESPONSE'] as SystemAudioKey[]).map((key) => (
              <SignalRow key={key} audioKey={key} item={signalMap.get(key)} />
            ))
          )}
        </Card>

        <Card title="Audio hướng dẫn từng phần" styles={{ body: { padding: 0 } }}>
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
    </Space>
  )
}

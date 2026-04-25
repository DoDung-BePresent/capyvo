import { useEffect, useRef } from 'react'
import { Modal, Typography } from 'antd'
import endSoundUrl from '@/assets/sounds/end-sound.mp3'

const { Text, Title } = Typography

export function SavingModal({ open }: { open: boolean }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (!open) return
    const audio = new Audio(endSoundUrl)
    audioRef.current = audio
    audio.play().catch(() => {})
    return () => {
      audio.pause()
      audio.src = ''
      audioRef.current = null
    }
  }, [open])
  return (
    <Modal
      open={open}
      footer={null}
      closable={false}
      centered
      title={null}
      styles={{
        container: {
          padding: 0,
          overflow: 'hidden',
        },
      }}
      className="border-2 border-[var(--ant-blue-4)] rounded-[5px]"
    >
      <div className="text-center py-4 bg-[var(--ant-blue-1)]!">
        <Title level={2}>Stop Talking</Title>
      </div>
      <div style={{ padding: '28px 32px', textAlign: 'center' }}>
        <Text style={{ fontSize: 15, display: 'block', marginBottom: 10 }}>
          Your response time has ended. Stop speaking now.
        </Text>
        <Text style={{ fontSize: 15, display: 'block', marginBottom: 10 }}>
          You will automatically proceed to the next question after your response has been saved.
        </Text>
        <Text style={{ fontSize: 15, display: 'block' }}>This may take several seconds.</Text>
      </div>
    </Modal>
  )
}

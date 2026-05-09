import { Card, Typography, Flex, Spin } from 'antd'

/**
 * Hooks
 */
import { useEffect, useRef } from 'react'

/**
 * Utils
 */
import { styled } from '@/shared/utils/cn'

/**
 * Assets
 */
import endSound from '@/assets/sounds/instructions/end-sound.mp3'

const { Title, Paragraph } = Typography

const Container = styled('div', 'h-full flex items-center justify-center')
const ContentCard = styled(Card, 'max-w-2xl w-full')

export function SavingView() {
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.play().catch((error) => console.log('Play failed:', error))
    }
  }, [])

  return (
    <Container>
      <audio ref={audioRef} src={endSound} preload="auto" />

      <ContentCard>
        <Flex vertical align="center" gap={24} style={{ padding: '40px 20px' }}>
          <Spin size="large" />

          <Title level={3} style={{ marginBottom: 0, textAlign: 'center' }}>
            Stop Talking
          </Title>

          <Flex vertical gap={12} style={{ textAlign: 'center' }}>
            <Paragraph style={{ fontSize: 16, marginBottom: 0 }}>
              Your response time has ended. Stop speaking now.
            </Paragraph>

            <Paragraph style={{ fontSize: 16, marginBottom: 0 }}>
              You will automatically proceed to the next question after your response has been
              saved.
            </Paragraph>

            <Paragraph style={{ fontSize: 16, marginBottom: 0, color: '#666' }}>
              This may take several seconds.
            </Paragraph>
          </Flex>
        </Flex>
      </ContentCard>
    </Container>
  )
}

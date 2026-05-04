import { useEffect, useRef } from 'react'
import { Card, Typography, Flex } from 'antd'
import { styled } from '@/shared/utils/cn'
import { StyledButton } from '@/shared/components'
import type { PartInstruction } from '../types/full-test.types'
import instructionPart1 from '@/assets/sounds/instructions/instruction-part-1.mp3'
import instructionPart2 from '@/assets/sounds/instructions/instruction-part-2.mp3'
import instructionPart3 from '@/assets/sounds/instructions/instruction-part-3.mp3'
import instructionPart4 from '@/assets/sounds/instructions/instruction-part-4.mp3'
import instructionPart5 from '@/assets/sounds/instructions/instruction-part-5.mp3'

const { Title, Paragraph } = Typography

const AUDIO_MAP: Record<number, string> = {
  1: instructionPart1,
  2: instructionPart2,
  3: instructionPart3,
  4: instructionPart4,
  5: instructionPart5,
}

const Container = styled('div', 'h-full flex flex-col gap-4!')
const ContentCard = styled(Card, 'flex-1 overflow-y-auto mb-4')
const ControlPanel = styled(Card, 'mt-auto')

interface PartInstructionViewProps {
  instruction: PartInstruction
  onContinue: () => void
  onCancel: () => void
  autoPlay?: boolean
}

export function PartInstructionView({
  instruction,
  onContinue,
  onCancel,
  autoPlay = true,
}: PartInstructionViewProps) {
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    if (autoPlay && audioRef.current) {
      audioRef.current.play().catch((error) => console.log('Auto-play failed:', error))
    }
  }, [autoPlay, instruction.partNumber])

  // Auto continue when audio ends
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleEnded = () => {
      onContinue()
    }

    audio.addEventListener('ended', handleEnded)
    return () => {
      audio.removeEventListener('ended', handleEnded)
    }
  }, [onContinue])

  return (
    <Container>
      <audio ref={audioRef} src={AUDIO_MAP[instruction.partNumber]} preload="auto" />

      <ContentCard>
        <Flex
          vertical
          gap={24}
          style={{
            maxWidth: 700,
            marginInline: 'auto',
          }}
        >
          <Title level={3} style={{ textAlign: 'center', marginBottom: 0 }}>
            {instruction.title}
          </Title>

          <Paragraph
            style={{
              fontSize: 16,
              lineHeight: 1.8,
              marginBottom: 0,
            }}
          >
            <strong>Directions:</strong> {instruction.directions}
          </Paragraph>
        </Flex>
      </ContentCard>

      <ControlPanel>
        <Flex justify="center">
          <StyledButton
            size="large"
            danger
            onClick={onCancel}
            style={{
              minWidth: 200,
            }}
          >
            Hủy làm đề
          </StyledButton>
        </Flex>
      </ControlPanel>
    </Container>
  )
}

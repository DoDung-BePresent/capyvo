import { Card, Flex, Statistic, Typography, Button, InputNumber } from 'antd'
import { TrophyOutlined, EditOutlined, CheckOutlined } from '@ant-design/icons'
import { useState, useRef, useEffect, useCallback } from 'react'
import { COLORS } from '../constants/user-color'
import { hexToRgba } from '../utils/color'
import { StyledButton } from './StyledButton'

const { Text } = Typography

interface GoalsWidgetProps {
  targetScore: number
  onTargetScoreChange?: (score: number) => void
}

export function GoalsWidget({ targetScore, onTargetScoreChange }: GoalsWidgetProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [newTarget, setNewTarget] = useState(targetScore)
  const cardRef = useRef<HTMLDivElement>(null)

  const handleSave = () => {
    if (newTarget > 0 && onTargetScoreChange) {
      onTargetScoreChange(newTarget)
    }
    setIsEditing(false)
  }

  const handleCancel = useCallback(() => {
    setNewTarget(targetScore)
    setIsEditing(false)
  }, [targetScore])

  // Click outside to cancel
  useEffect(() => {
    if (!isEditing) return

    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        handleCancel()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isEditing, handleCancel])

  return (
    <Card
      ref={cardRef}
      className="rounded-lg! transition-all! duration-150! ease-out! hover:translate-y-1!"
      style={{
        minHeight: 180,
        boxShadow: `0 4px 0 0 ${hexToRgba(COLORS.primary, 0.3)}`,
      }}
      styles={{
        body: {
          height: '100%',
        },
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = 'none'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = `0 4px 0 0 ${hexToRgba(COLORS.primary, 0.3)}`
      }}
    >
      <Flex vertical gap={12} style={{ height: '100%' }}>
        <Flex align="center" justify="space-between">
          <Flex align="center" gap={8}>
            <TrophyOutlined style={{ fontSize: 20, color: COLORS.primary }} />
          </Flex>
          {!isEditing && onTargetScoreChange && (
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setNewTarget(targetScore)
                setIsEditing(true)
              }}
            />
          )}
        </Flex>

        {isEditing ? (
          <Flex vertical gap={12} style={{ flex: 1 }}>
            <InputNumber
              min={0}
              max={200}
              value={newTarget}
              onChange={(value) => setNewTarget(value || 0)}
              style={{ width: '100%' }}
              size="large"
              autoFocus
              onPressEnter={handleSave}
            />
            <StyledButton
              type="primary"
              icon={<CheckOutlined />}
              onClick={handleSave}
              block
              style={{
                backgroundColor: COLORS.primary,
                borderColor: COLORS.primary,
              }}
              size="large"
            >
              Lưu
            </StyledButton>
          </Flex>
        ) : (
          <>
            <Flex justify="center" style={{ flex: 1 }} align="center">
              <Statistic
                value={targetScore}
                valueStyle={{ fontSize: 40, fontWeight: 700, color: COLORS.primary }}
              />
            </Flex>
            <Text type="secondary" style={{ fontSize: 12, textAlign: 'center' }}>
              điểm
            </Text>
          </>
        )}
      </Flex>
    </Card>
  )
}

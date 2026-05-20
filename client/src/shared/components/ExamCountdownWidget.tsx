import { Card, Flex, Statistic, Typography, DatePicker, Button } from 'antd'
import { CalendarOutlined, EditOutlined, CheckOutlined } from '@ant-design/icons'
import { useState, useRef, useEffect, useCallback } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import { COLORS } from '../constants/user-color'
import { hexToRgba } from '../utils/color'
import { StyledButton } from './StyledButton'

const { Text } = Typography

interface ExamCountdownWidgetProps {
  examDate: string | null
  onExamDateChange: (date: string | null) => void
}

export function ExamCountdownWidget({ examDate, onExamDateChange }: ExamCountdownWidgetProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [tempDate, setTempDate] = useState<Dayjs | null>(examDate ? dayjs(examDate) : null)
  const cardRef = useRef<HTMLDivElement>(null)

  const daysUntilExam = examDate
    ? Math.ceil((new Date(examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null

  const handleSave = () => {
    if (tempDate) {
      onExamDateChange(tempDate.format('YYYY-MM-DD'))
    } else {
      onExamDateChange(null)
    }
    setIsEditing(false)
  }

  const handleCancel = useCallback(() => {
    setTempDate(examDate ? dayjs(examDate) : null)
    setIsEditing(false)
  }, [examDate])

  // Click outside to cancel
  useEffect(() => {
    if (!isEditing) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement

      // Check if click is inside card
      if (cardRef.current && cardRef.current.contains(target)) {
        return
      }

      // Check if click is inside DatePicker dropdown (Ant Design portal)
      if (target.closest('.ant-picker-dropdown')) {
        return
      }

      // Click is outside both card and dropdown, cancel editing
      handleCancel()
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
        e.currentTarget.style.boxShadow = `0 4px 0 0 ${hexToRgba(COLORS.accent, 0.3)}`
      }}
    >
      <Flex vertical gap={12} style={{ height: '100%' }}>
        <Flex align="center" justify="space-between">
          <Flex align="center" gap={8}>
            <CalendarOutlined style={{ fontSize: 20, color: COLORS.accent }} />
          </Flex>
          {!isEditing && (
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setTempDate(examDate ? dayjs(examDate) : null)
                setIsEditing(true)
              }}
            />
          )}
        </Flex>

        {isEditing ? (
          <Flex vertical gap={12} style={{ flex: 1 }}>
            <DatePicker
              value={tempDate}
              onChange={(date) => setTempDate(date)}
              format="DD/MM/YYYY"
              placeholder="Chọn ngày thi"
              style={{ width: '100%' }}
              size="large"
              disabledDate={(current) => current && current < dayjs().startOf('day')}
            />
            <StyledButton
              type="primary"
              icon={<CheckOutlined />}
              onClick={handleSave}
              block
              size="large"
              style={{
                backgroundColor: COLORS.primary,
                borderColor: COLORS.primary,
              }}
              shadowColor={hexToRgba(COLORS.accent, 0.6)}
            >
              Lưu
            </StyledButton>
          </Flex>
        ) : (
          <>
            {daysUntilExam !== null ? (
              <>
                <Flex justify="center" style={{ flex: 1 }} align="center">
                  <Statistic
                    value={daysUntilExam}
                    suffix="d"
                    valueStyle={{
                      fontSize: 40,
                      fontWeight: 700,
                      color: daysUntilExam <= 7 ? COLORS.accent : COLORS.primary,
                    }}
                  />
                </Flex>
                <Text type="secondary" style={{ fontSize: 12, textAlign: 'center' }}>
                  {dayjs(examDate).format('DD/MM/YYYY')}
                </Text>
              </>
            ) : (
              <Flex vertical align="center" gap={8} style={{ flex: 1 }} justify="center">
                <Text type="secondary" style={{ fontSize: 14 }}>
                  Chưa đặt ngày thi
                </Text>
                <StyledButton
                  type="primary"
                  size="large"
                  style={{
                    backgroundColor: COLORS.primary,
                    borderColor: COLORS.primary,
                  }}
                  block
                  onClick={() => setIsEditing(true)}
                  shadowColor={hexToRgba(COLORS.accent, 0.6)}
                >
                  Đặt ngày thi
                </StyledButton>
              </Flex>
            )}
          </>
        )}
      </Flex>
    </Card>
  )
}

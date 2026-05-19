import { Card, Flex, Statistic, Typography, DatePicker, Button } from 'antd'
import { CalendarOutlined, EditOutlined } from '@ant-design/icons'
import { useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import { COLORS } from '../constants/user-color'
import { hexToRgba } from '../utils/color'

const { Text } = Typography

interface ExamCountdownWidgetProps {
  examDate: string | null
  onExamDateChange: (date: string | null) => void
}

export function ExamCountdownWidget({ examDate, onExamDateChange }: ExamCountdownWidgetProps) {
  const [isEditing, setIsEditing] = useState(false)

  const daysUntilExam = examDate
    ? Math.ceil((new Date(examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null

  const handleDateChange = (date: Dayjs | null) => {
    if (date) {
      onExamDateChange(date.format('YYYY-MM-DD'))
    } else {
      onExamDateChange(null)
    }
    setIsEditing(false)
  }

  return (
    <Card
      className="rounded-lg! transition-all! duration-150! ease-out! hover:translate-y-1!"
      style={{
        minHeight: 180,
        boxShadow: `0 4px 0 0 ${hexToRgba(COLORS.accent, 0.3)}`,
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
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => setIsEditing(!isEditing)}
          />
        </Flex>

        {isEditing ? (
          <Flex vertical gap={12} style={{ flex: 1 }} justify="center">
            <DatePicker
              value={examDate ? dayjs(examDate) : null}
              onChange={handleDateChange}
              format="DD/MM/YYYY"
              placeholder="Chọn ngày thi"
              style={{ width: '100%' }}
              size="large"
              disabledDate={(current) => current && current < dayjs().startOf('day')}
            />
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
                <Button type="primary" size="small" onClick={() => setIsEditing(true)}>
                  Đặt ngày thi
                </Button>
              </Flex>
            )}
          </>
        )}
      </Flex>
    </Card>
  )
}

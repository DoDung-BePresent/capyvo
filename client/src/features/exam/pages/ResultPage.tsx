import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Button, Card, Divider, Empty, Flex, Image, Spin, Tag, Typography } from 'antd'
import { ArrowLeftOutlined, SoundOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

import { sessionService } from '@/features/exam/services/session.service'
import { queryKeys } from '@/lib/query-keys'
import { PART_META } from '@/features/admin/types'

const { Text, Title } = Typography

export default function ResultPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()

  const { data: session, isLoading } = useQuery({
    queryKey: queryKeys.practiceSessions.detail(sessionId ?? ''),
    queryFn: () => sessionService.getSessionDetail(sessionId ?? ''),
    enabled: !!sessionId,
  })

  if (isLoading) {
    return (
      <Flex justify="center" align="center" style={{ minHeight: '60vh' }}>
        <Spin size="large" />
      </Flex>
    )
  }

  if (!session) {
    return <Empty description="Không tìm thấy kết quả" style={{ marginTop: 80 }} />
  }

  const { userResponses, examSet } = session

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 0 48px' }}>
      {/* Header */}
      <Flex align="center" gap={12} style={{ marginBottom: 8 }}>
        <Button icon={<ArrowLeftOutlined />} type="text" onClick={() => navigate(-1)} />
        <div>
          <Title level={4} style={{ margin: 0 }}>
            {examSet.title}
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {dayjs(session.startedAt).format('DD/MM/YYYY HH:mm')} • {userResponses.length} câu đã
            ghi âm
          </Text>
        </div>
      </Flex>

      <Divider />

      {userResponses.length === 0 && (
        <Empty description="Không có câu trả lời nào được ghi âm trong buổi này" />
      )}

      <Flex vertical gap={20}>
        {userResponses.map((item) => {
          const { question } = item
          const partMeta = PART_META[question.partNumber as keyof typeof PART_META]

          return (
            <Card
              key={item.id}
              styles={{ body: { padding: '20px 24px' } }}
              title={
                <Flex align="center" gap={8}>
                  <Tag color="blue">{partMeta?.label ?? `Part ${question.partNumber}`}</Tag>
                  <Text style={{ fontWeight: 600 }}>Câu {question.questionNumber}</Text>
                </Flex>
              }
            >
              {/* Question content */}
              {question.contextText && (
                <Text
                  type="secondary"
                  style={{ display: 'block', marginBottom: 12, fontSize: 14, fontStyle: 'italic' }}
                >
                  {question.contextText}
                </Text>
              )}

              {question.imageUrls?.[0] && (
                <Flex justify="center" style={{ marginBottom: 16 }}>
                  <Image
                    src={question.imageUrls[0]}
                    style={{ maxHeight: 260, objectFit: 'contain' }}
                    preview={false}
                  />
                </Flex>
              )}

              {question.contentText && (
                <Text style={{ display: 'block', fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>
                  {question.contentText}
                </Text>
              )}

              {question.questionText && (
                <Text style={{ display: 'block', fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>
                  {question.questionText}
                </Text>
              )}

              {/* Audio player */}
              {item.audioUrl ? (
                <Flex align="center" gap={12} style={{ marginTop: 8 }}>
                  <SoundOutlined style={{ color: '#6366f1', fontSize: 18 }} />
                  <audio controls src={item.audioUrl} style={{ width: '100%', height: 36 }} />
                </Flex>
              ) : (
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Không có bản ghi âm cho câu này
                </Text>
              )}
            </Card>
          )
        })}
      </Flex>

      {/* Back link */}
      <Flex justify="center" style={{ marginTop: 40 }}>
        <Link to="/practice">← Về trang luyện tập</Link>
      </Flex>
    </div>
  )
}

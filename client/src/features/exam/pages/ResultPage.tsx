import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Card, Empty, Flex, Image, Spin, Tag, Typography } from 'antd'
import dayjs from 'dayjs'

import { sessionService } from '@/features/exam/services/session.service'
import { queryKeys } from '@/lib/query-keys'
import { PART_META } from '@/features/admin/types'
import { WavesurferPlayer } from '@/features/exam/components/WavesurferPlayer'
import { PageHeader } from '@/shared/components'

const { Text } = Typography

export default function ResultPage() {
  const { sessionId } = useParams<{ sessionId: string }>()

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

  const { userResponses, examSet, partNumber } = session

  const breadcrumbs =
    partNumber != null
      ? [
          { label: 'Luyện theo Part', href: '/practice' },
          {
            label: PART_META[partNumber as keyof typeof PART_META]?.label ?? `Part ${partNumber}`,
            href: `/practice/part/${partNumber}`,
          },
          { label: examSet.title, href: `/practice/part/${partNumber}/set/${examSet.id}` },
          { label: 'Kết quả' },
        ]
      : [
          { label: 'Thi thử', href: '/exam' },
          { label: examSet.title, href: `/exam/${examSet.id}` },
          { label: 'Kết quả' },
        ]

  return (
    <>
      <PageHeader
        title={`Kết quả — ${examSet.title}`}
        description={`${dayjs(session.startedAt).format('DD/MM/YYYY HH:mm')} • ${userResponses.length} câu đã ghi âm`}
        breadcrumbs={breadcrumbs}
      />

      {userResponses.length === 0 && (
        <Empty description="Không có câu trả lời nào được ghi âm trong buổi này" />
      )}

      <Flex vertical gap={20} style={{ paddingBottom: 48 }}>
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
                <div style={{ marginTop: 12 }}>
                  <WavesurferPlayer url={item.audioUrl} />
                </div>
              ) : (
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Không có bản ghi âm cho câu này
                </Text>
              )}
            </Card>
          )
        })}
      </Flex>
    </>
  )
}

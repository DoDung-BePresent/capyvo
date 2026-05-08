import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, Avatar, Typography, Flex, Empty, Spin, message } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import { shareService, type AllowedEmoji, type PublicShareDetail } from '../services/share.service'
import { queryKeys } from '@/lib/query-keys'
import { ReactionBar } from './ReactionBar'

const { Text, Paragraph } = Typography

interface PublicSharesPanelProps {
  questionId: string
}

export function PublicSharesPanel({ questionId }: PublicSharesPanelProps) {
  const queryClient = useQueryClient()
  const [expandedShareId, setExpandedShareId] = useState<string | null>(null)

  const { data: shares, isLoading } = useQuery({
    queryKey: queryKeys.shares.byQuestion(questionId),
    queryFn: () => shareService.getSharesByQuestion(questionId),
    enabled: !!questionId,
  })

  const toggleReactionMutation = useMutation({
    mutationFn: ({ shareId, emoji }: { shareId: string; emoji: AllowedEmoji }) =>
      shareService.toggleReaction(shareId, emoji),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shares.byQuestion(questionId) })

      if (result.action === 'added') {
        message.success('Đã thêm reaction')
      } else if (result.action === 'removed') {
        message.success('Đã bỏ reaction')
      } else {
        message.success('Đã đổi reaction')
      }
    },
    onError: () => {
      message.error('Lỗi khi thêm reaction')
    },
  })

  const handleReactionClick = (shareId: string, emoji: AllowedEmoji) => {
    toggleReactionMutation.mutate({ shareId, emoji })
  }

  if (isLoading) {
    return (
      <Flex justify="center" align="center" style={{ minHeight: 200 }}>
        <Spin />
      </Flex>
    )
  }

  if (!shares || shares.length === 0) {
    return (
      <Empty
        description="Chưa có ai chia sẻ bài tập này"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        style={{ marginTop: 40 }}
      />
    )
  }

  return (
    <Flex vertical gap={16}>
      {shares.map((share) => (
        <ShareCard
          key={share.id}
          share={share}
          expanded={expandedShareId === share.id}
          onToggleExpand={() => setExpandedShareId(expandedShareId === share.id ? null : share.id)}
          onReactionClick={handleReactionClick}
        />
      ))}
    </Flex>
  )
}

interface ShareCardProps {
  share: PublicShareDetail
  expanded: boolean
  onToggleExpand: () => void
  onReactionClick: (shareId: string, emoji: AllowedEmoji) => void
}

function ShareCard({ share, expanded, onToggleExpand, onReactionClick }: ShareCardProps) {
  const displayName = share.user.fullName || share.user.email.split('@')[0]
  const transcript = share.response.transcript || 'Chưa có transcript'
  const truncatedTranscript =
    transcript.length > 100 ? transcript.slice(0, 100) + '...' : transcript

  return (
    <Card size="small" hoverable onClick={onToggleExpand} style={{ cursor: 'pointer' }}>
      <Flex vertical gap={12}>
        {/* User info */}
        <Flex align="center" gap={8}>
          <Avatar size="small" icon={<UserOutlined />} />
          <Text strong style={{ fontSize: 13 }}>
            {displayName}
          </Text>
          <Text type="secondary" style={{ fontSize: 12, marginLeft: 'auto' }}>
            {new Date(share.createdAt).toLocaleDateString('vi-VN')}
          </Text>
        </Flex>

        {/* Transcript */}
        <Paragraph
          style={{
            margin: 0,
            fontSize: 13,
            color: '#595959',
            whiteSpace: expanded ? 'pre-wrap' : 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {expanded ? transcript : truncatedTranscript}
        </Paragraph>

        {/* Reactions */}
        <ReactionBar
          reactions={share.reactions}
          onReactionClick={(emoji) => {
            onReactionClick(share.id, emoji)
          }}
        />
      </Flex>
    </Card>
  )
}

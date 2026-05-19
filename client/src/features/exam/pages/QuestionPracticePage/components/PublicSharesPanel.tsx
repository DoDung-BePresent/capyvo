/**
 * Hooks
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

/**
 * Components
 */
import { Card, Avatar, Typography, Flex, Empty, Spin, message } from 'antd'
import { ReactionBar } from './ReactionBar'
import { WaveformVisualizer } from '@/features/exam/components/WaveformVisualizer'

/**
 * Icons
 */
import { UserOutlined } from '@ant-design/icons'

/**
 * Services
 */
import {
  shareService,
  type AllowedEmoji,
  type PublicShareDetail,
} from '@/features/exam/services/share.service'

/**
 * QUERY_KEYS
 */
import { queryKeys } from '@/lib/query-keys'

const { Text } = Typography

interface PublicSharesPanelProps {
  questionId: string
}

export function PublicSharesPanel({ questionId }: PublicSharesPanelProps) {
  const queryClient = useQueryClient()

  const { data: shares, isLoading } = useQuery({
    queryKey: queryKeys.shares.byQuestion(questionId),
    queryFn: () => shareService.getSharesByQuestion(questionId),
    enabled: !!questionId,
  })

  const toggleReactionMutation = useMutation({
    mutationFn: ({ shareId, emoji }: { shareId: string; emoji: AllowedEmoji }) =>
      shareService.toggleReaction(shareId, emoji),
    onMutate: async ({ shareId, emoji }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.shares.byQuestion(questionId) })

      // Snapshot previous value
      const previousShares = queryClient.getQueryData<PublicShareDetail[]>(
        queryKeys.shares.byQuestion(questionId),
      )

      // Optimistically update
      if (previousShares) {
        queryClient.setQueryData<PublicShareDetail[]>(
          queryKeys.shares.byQuestion(questionId),
          previousShares.map((share) => {
            if (share.id !== shareId) return share

            const existingReaction = share.reactions.find((r) => r.userReacted)
            const clickedReaction = share.reactions.find((r) => r.emoji === emoji)

            let newReactions = [...share.reactions]

            if (existingReaction?.emoji === emoji) {
              // Remove reaction
              newReactions = newReactions.map((r) =>
                r.emoji === emoji
                  ? { ...r, count: Math.max(0, r.count - 1), userReacted: false }
                  : r,
              )
            } else if (existingReaction) {
              // Change reaction
              newReactions = newReactions.map((r) => {
                if (r.emoji === existingReaction.emoji) {
                  return { ...r, count: Math.max(0, r.count - 1), userReacted: false }
                }
                if (r.emoji === emoji) {
                  return { ...r, count: r.count + 1, userReacted: true }
                }
                return r
              })
            } else {
              // Add new reaction
              if (clickedReaction) {
                newReactions = newReactions.map((r) =>
                  r.emoji === emoji ? { ...r, count: r.count + 1, userReacted: true } : r,
                )
              } else {
                newReactions.push({ emoji, count: 1, userReacted: true })
              }
            }

            return { ...share, reactions: newReactions }
          }),
        )
      }

      return { previousShares }
    },
    onError: (_error, _variables, context) => {
      // Rollback on error
      if (context?.previousShares) {
        queryClient.setQueryData(queryKeys.shares.byQuestion(questionId), context.previousShares)
      }
      message.error('Lỗi khi thêm reaction')
    },
    onSettled: () => {
      // Refetch to sync with server
      queryClient.invalidateQueries({ queryKey: queryKeys.shares.byQuestion(questionId) })
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
        <ShareCard key={share.id} share={share} onReactionClick={handleReactionClick} />
      ))}
    </Flex>
  )
}

interface ShareCardProps {
  share: PublicShareDetail
  onReactionClick: (shareId: string, emoji: AllowedEmoji) => void
}

function ShareCard({ share, onReactionClick }: ShareCardProps) {
  const displayName = share.user.fullName || share.user.email.split('@')[0]

  return (
    <Card className="rounded-lg! border-2!" size="small" style={{ cursor: 'default' }}>
      <Flex vertical gap={12}>
        {/* User info */}
        <Flex align="center" gap={8}>
          <Avatar size="small" shape="square" src={share.user.avatarUrl} icon={<UserOutlined />} />
          <Text strong style={{ fontSize: 13 }}>
            {displayName}
          </Text>
          <Text type="secondary" style={{ fontSize: 12, marginLeft: 'auto' }}>
            {new Date(share.createdAt).toLocaleDateString('vi-VN')}
          </Text>
        </Flex>

        {/* Waveform audio player */}
        {share.response.audioUrl && (
          <div onClick={(e) => e.stopPropagation()}>
            <WaveformVisualizer audioUrl={share.response.audioUrl} />
          </div>
        )}

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

import { Flex, Button, Badge } from 'antd'
import type { AllowedEmoji } from '../services/share.service'

const ALLOWED_EMOJIS: AllowedEmoji[] = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '😍', '💖', '🤔']

interface ReactionBarProps {
  reactions: Array<{
    emoji: string
    count: number
    userReacted: boolean
  }>
  onReactionClick: (emoji: AllowedEmoji) => void
}

export function ReactionBar({ reactions, onReactionClick }: ReactionBarProps) {
  // Create a map for quick lookup
  const reactionMap = new Map(reactions.map((r) => [r.emoji, r]))

  return (
    <Flex gap={8} wrap="wrap" onClick={(e) => e.stopPropagation()}>
      {ALLOWED_EMOJIS.map((emoji) => {
        const reaction = reactionMap.get(emoji)
        const count = reaction?.count || 0
        const userReacted = reaction?.userReacted || false

        return (
          <Badge key={emoji} count={count} showZero={false} offset={[-5, 5]}>
            <Button
              size="small"
              type={userReacted ? 'primary' : 'default'}
              onClick={() => onReactionClick(emoji)}
              style={{
                fontSize: 16,
                padding: '4px 8px',
                height: 'auto',
                border: userReacted ? '2px solid #1890ff' : '1px solid #d9d9d9',
              }}
            >
              {emoji}
            </Button>
          </Badge>
        )
      })}
    </Flex>
  )
}

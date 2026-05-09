import { Flex, Button, Popover } from 'antd'
import { SmileOutlined } from '@ant-design/icons'
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
  // Get reactions that have been used (count > 0)
  const usedReactions = reactions.filter((r) => r.count > 0)

  // Emoji picker content
  const emojiPickerContent = (
    <Flex gap={4} wrap="wrap" style={{ maxWidth: 240 }}>
      {ALLOWED_EMOJIS.map((emoji) => {
        return (
          <Button
            key={emoji}
            size="small"
            type="text"
            onClick={() => onReactionClick(emoji)}
            style={{
              fontSize: 14,
              padding: '2.5px',
            }}
          >
            {emoji}
          </Button>
        )
      })}
    </Flex>
  )

  return (
    <Flex gap={8} wrap="wrap" align="center">
      {/* Add reaction button with popover */}
      <Popover
        content={emojiPickerContent}
        trigger="click"
        placement="topLeft"
        overlayStyle={{ zIndex: 1050 }}
      >
        <Button
          size="small"
          shape="circle"
          icon={<SmileOutlined />}
          onClick={(e) => e.stopPropagation()}
          style={{
            fontSize: 14,
          }}
        />
      </Popover>

      {/* Show reactions that have been used */}
      {usedReactions.map((reaction) => (
        <Button
          size="small"
          onClick={(e) => {
            e.stopPropagation()
            onReactionClick(reaction.emoji as AllowedEmoji)
          }}
          style={{
            fontSize: 14,
            border: reaction.userReacted ? '1px solid #1890ff' : '1px solid #d9d9d9',
          }}
          className="rounded-lg!"
        >
          {reaction.emoji}
          <span className="text-xs">{reaction.count}</span>
        </Button>
      ))}
    </Flex>
  )
}

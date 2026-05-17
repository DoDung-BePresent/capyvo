import { Space, Tag, Typography } from 'antd'

const { Text } = Typography

interface TopicTagsProps {
  topics: Array<{ id: string; name: string }>
}

export function TopicTags({ topics }: TopicTagsProps) {
  if (!topics || topics.length === 0) {
    return <Text type="secondary">—</Text>
  }
  return (
    <Space size={4} wrap>
      {topics.map((topic) => (
        <Tag key={topic.id}>{topic.name}</Tag>
      ))}
    </Space>
  )
}

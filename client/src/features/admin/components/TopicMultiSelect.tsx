import { useState } from 'react'
import { Select, Button, Space, Typography } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useTopics } from '../hooks/useTopic'
import { TopicFormModal } from './TopicFormModal'

const { Text } = Typography

interface Props {
  value?: string[]
  onChange?: (value: string[]) => void
}

/**
 * Multi-select component for topics with inline creation
 * Validates: Requirements 15.1, 15.2, 15.3, 15.6, 15.7
 */
export function TopicMultiSelect({ value, onChange }: Props) {
  const { data: topics = [], isLoading } = useTopics()
  const [modalOpen, setModalOpen] = useState(false)

  const options = topics.map((topic) => ({
    label: topic.name,
    value: topic.id,
  }))

  const selectedCount = value?.length ?? 0

  return (
    <>
      <Space direction="vertical" style={{ width: '100%' }} size={8}>
        <Select
          mode="multiple"
          placeholder="Chọn chủ đề..."
          value={value}
          onChange={onChange}
          options={options}
          loading={isLoading}
          style={{ width: '100%' }}
          maxTagCount="responsive"
          dropdownRender={(menu) => (
            <>
              {menu}
              <div style={{ padding: '8px', borderTop: '1px solid #f0f0f0' }}>
                <Button
                  type="text"
                  icon={<PlusOutlined />}
                  onClick={() => setModalOpen(true)}
                  block
                >
                  Tạo chủ đề mới
                </Button>
              </div>
            </>
          )}
        />
        {selectedCount > 0 && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            Đã chọn {selectedCount} chủ đề
          </Text>
        )}
      </Space>

      <TopicFormModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}

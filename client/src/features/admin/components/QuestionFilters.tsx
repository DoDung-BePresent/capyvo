import { Space, Select, Input } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { QuestionType, QuestionStatus, type TopicWithCount } from '../types'

const { Option } = Select

interface QuestionFiltersProps {
  // Filter values
  type?: QuestionType | 'ALL'
  status?: QuestionStatus | 'ALL'
  topicId?: string
  search?: string

  // Filter change handlers
  onTypeChange: (value: QuestionType | 'ALL') => void
  onStatusChange: (value: QuestionStatus | 'ALL') => void
  onTopicChange: (value: string | undefined) => void
  onSearchChange: (value: string) => void

  // Data for filters
  topics: TopicWithCount[]

  // Filter counts
  counts?: {
    total: number
    byType?: Record<QuestionType | 'ALL', number>
    byStatus?: Record<QuestionStatus | 'ALL', number>
  }
}

export default function QuestionFilters({
  type = 'ALL',
  status = 'ALL',
  topicId,
  search = '',
  onTypeChange,
  onStatusChange,
  onTopicChange,
  onSearchChange,
  topics,
  counts,
}: QuestionFiltersProps) {
  return (
    <Space size="middle" wrap>
      {/* Type Filter */}
      <Select
        value={type}
        onChange={onTypeChange}
        style={{ width: 180 }}
        size="large"
        placeholder="Loại câu hỏi"
      >
        <Option value="ALL">
          Tất cả loại {counts?.byType?.ALL ? `(${counts.byType.ALL})` : ''}
        </Option>
        <Option value={QuestionType.PRACTICE}>
          Practice {counts?.byType?.PRACTICE ? `(${counts.byType.PRACTICE})` : ''}
        </Option>
        <Option value={QuestionType.FORECAST}>
          Forecast {counts?.byType?.FORECAST ? `(${counts.byType.FORECAST})` : ''}
        </Option>
        <Option value={QuestionType.CUSTOM}>
          Custom {counts?.byType?.CUSTOM ? `(${counts.byType.CUSTOM})` : ''}
        </Option>
      </Select>

      {/* Status Filter */}
      <Select
        value={status}
        onChange={onStatusChange}
        style={{ width: 180 }}
        size="large"
        placeholder="Trạng thái"
      >
        <Option value="ALL">
          Tất cả trạng thái {counts?.byStatus?.ALL ? `(${counts.byStatus.ALL})` : ''}
        </Option>
        <Option value={QuestionStatus.DRAFT}>
          Draft {counts?.byStatus?.DRAFT ? `(${counts.byStatus.DRAFT})` : ''}
        </Option>
        <Option value={QuestionStatus.PUBLISHED}>
          Published {counts?.byStatus?.PUBLISHED ? `(${counts.byStatus.PUBLISHED})` : ''}
        </Option>
        <Option value={QuestionStatus.ARCHIVED}>
          Archived {counts?.byStatus?.ARCHIVED ? `(${counts.byStatus.ARCHIVED})` : ''}
        </Option>
      </Select>

      {/* Topic Filter */}
      <Select
        value={topicId}
        onChange={onTopicChange}
        style={{ width: 220 }}
        size="large"
        placeholder="Chọn chủ đề"
        allowClear
        showSearch
        optionFilterProp="children"
        filterOption={(input, option) => {
          const children = option?.children as unknown
          if (typeof children === 'string') {
            return children.toLowerCase().includes(input.toLowerCase())
          }
          return false
        }}
      >
        {topics.map((topic) => (
          <Option key={topic.id} value={topic.id}>
            {topic.name} ({topic.questionCount})
          </Option>
        ))}
      </Select>

      {/* Search Input */}
      <Input
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Tìm kiếm nội dung câu hỏi..."
        prefix={<SearchOutlined />}
        allowClear
        size="large"
        style={{ width: 280 }}
      />

      {/* Total Count Display */}
      {counts?.total !== undefined && (
        <span style={{ color: '#8c8c8c', fontSize: 14, marginLeft: 8 }}>
          Tổng: {counts.total} câu hỏi
        </span>
      )}
    </Space>
  )
}

import { Space, Button } from 'antd'
import { CheckCircleOutlined, FileTextOutlined, InboxOutlined } from '@ant-design/icons'
import { QuestionStatus } from '../types'
import { useBulkUpdateStatus } from '../hooks/useQuestion'

interface BulkActionsToolbarProps {
  selectedQuestionIds: string[]
  onClearSelection: () => void
}

export default function BulkActionsToolbar({
  selectedQuestionIds,
  onClearSelection,
}: BulkActionsToolbarProps) {
  const bulkUpdateMutation = useBulkUpdateStatus()

  const handlePublish = () => {
    bulkUpdateMutation.mutate(
      {
        questionIds: selectedQuestionIds,
        status: QuestionStatus.PUBLISHED,
      },
      {
        onSuccess: () => {
          onClearSelection()
        },
      },
    )
  }

  const handleUnpublish = () => {
    bulkUpdateMutation.mutate(
      {
        questionIds: selectedQuestionIds,
        status: QuestionStatus.DRAFT,
      },
      {
        onSuccess: () => {
          onClearSelection()
        },
      },
    )
  }

  const handleArchive = () => {
    bulkUpdateMutation.mutate(
      {
        questionIds: selectedQuestionIds,
        status: QuestionStatus.ARCHIVED,
      },
      {
        onSuccess: () => {
          onClearSelection()
        },
      },
    )
  }

  if (selectedQuestionIds.length === 0) {
    return null
  }

  return (
    <div
      style={{
        padding: '16px',
        background: '#f0f2f5',
        borderRadius: '8px',
        marginBottom: '16px',
      }}
    >
      <Space size="middle" align="center">
        <span style={{ fontWeight: 500, color: '#262626' }}>
          Đã chọn {selectedQuestionIds.length} câu hỏi
        </span>

        <Button
          type="primary"
          icon={<CheckCircleOutlined />}
          onClick={handlePublish}
          loading={bulkUpdateMutation.isPending}
        >
          Xuất bản
        </Button>

        <Button
          icon={<FileTextOutlined />}
          onClick={handleUnpublish}
          loading={bulkUpdateMutation.isPending}
        >
          Chuyển về Draft
        </Button>

        <Button
          icon={<InboxOutlined />}
          onClick={handleArchive}
          loading={bulkUpdateMutation.isPending}
        >
          Lưu trữ
        </Button>

        <Button type="text" onClick={onClearSelection}>
          Bỏ chọn
        </Button>
      </Space>
    </div>
  )
}

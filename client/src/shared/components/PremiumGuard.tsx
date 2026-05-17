import { ReactNode } from 'react'
import { Modal } from 'antd'
import { CrownOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useIsPremium } from '@/features/auth/hooks/useSubscription'

interface PremiumGuardProps {
  children: ReactNode
  feature?: string
  showModal?: boolean
}

/**
 * Component to guard premium features
 * Shows upgrade modal for FREE users
 */
export function PremiumGuard({ children, feature, showModal = true }: PremiumGuardProps) {
  const navigate = useNavigate()
  const isPremium = useIsPremium()

  const handleUpgrade = () => {
    navigate('/pricing')
  }

  if (isPremium) {
    return <>{children}</>
  }

  if (!showModal) {
    return null
  }

  return (
    <div
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()

        Modal.confirm({
          title: (
            <div className="flex items-center space-x-2">
              <CrownOutlined className="text-yellow-500" />
              <span>Tính năng Premium</span>
            </div>
          ),
          content: (
            <div className="space-y-2">
              <p>
                {feature
                  ? `${feature} chỉ dành cho người dùng Premium.`
                  : 'Tính năng này chỉ dành cho người dùng Premium.'}
              </p>
              <p className="text-sm text-gray-600">
                Nâng cấp ngay để trải nghiệm đầy đủ tính năng:
              </p>
              <ul className="list-inside list-disc space-y-1 text-sm text-gray-600">
                <li>Luyện full đề không giới hạn</li>
                <li>AI chấm điểm phát âm và nội dung</li>
                <li>Phân tích chi tiết từng câu trả lời</li>
                <li>Lưu lịch sử luyện tập</li>
              </ul>
            </div>
          ),
          okText: 'Nâng cấp ngay',
          cancelText: 'Để sau',
          onOk: handleUpgrade,
          centered: true,
        })
      }}
      className="cursor-pointer"
    >
      {children}
    </div>
  )
}

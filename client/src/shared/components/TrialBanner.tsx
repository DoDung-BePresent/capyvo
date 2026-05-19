import { Alert } from 'antd'
import { ClockCircleOutlined, CrownOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useCurrentSubscription } from '@/features/auth/hooks/useSubscription'

export function TrialBanner() {
  const navigate = useNavigate()
  const { data } = useCurrentSubscription()

  const trialStatus = data?.trialStatus
  const isOnTrial = trialStatus?.isOnTrial ?? false
  const daysRemaining = trialStatus?.daysRemaining ?? 0

  if (!isOnTrial || daysRemaining <= 0) return null

  const isLastDay = daysRemaining === 1
  const isUrgent = daysRemaining <= 3

  return (
    <div style={{ animation: 'slideDown 0.3s ease-out' }}>
      <Alert
        description={
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {isUrgent ? (
                <ClockCircleOutlined className="text-(--ant-color-warning)!" />
              ) : (
                <CrownOutlined className="text-(--ant-color-primary)!" />
              )}
              <span>
                {isLastDay ? (
                  <>
                    <strong>Ngày cuối cùng</strong> của gói dùng thử Premium! Nâng cấp ngay để tiếp
                    tục sử dụng AI chấm điểm và luyện full đề.
                  </>
                ) : (
                  <>
                    Bạn đang dùng thử Premium miễn phí. Còn <strong>{daysRemaining} ngày</strong> để
                    trải nghiệm đầy đủ tính năng.
                  </>
                )}
              </span>
            </div>
            <button
              onClick={() => navigate('/pricing')}
              className="ml-4 rounded bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-1.5 text-sm font-medium text-white transition-all hover:from-purple-700 hover:to-blue-700"
            >
              Nâng cấp ngay
            </button>
          </div>
        }
        type={isUrgent ? 'warning' : 'info'}
        styles={{
          root: { padding: '12px 16px' },
          icon: { display: 'none' },
        }}
        banner
        closable
        className={
          isUrgent
            ? 'border-b-2! border-(--ant-color-warning)!'
            : 'border-b-2! border-(--ant-color-primary)!'
        }
      />
    </div>
  )
}

import { Alert } from 'antd'
import { WifiOutlined } from '@ant-design/icons'
import { WifiOff } from 'lucide-react'

import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus'

export function NetworkStatusBanner() {
  const { isOnline, isSlowConnection } = useNetworkStatus()

  if (isOnline && !isSlowConnection) return null

  return (
    <div style={{ animation: 'slideDown 0.3s ease-out' }}>
      {!isOnline ? (
        <Alert
          description={
            <div className="flex items-center justify-center space-x-2">
              <WifiOff size={16} className="text-(--ant-color-error)!" />
              <span>
                You are offline. Some features are unavailable. Changes will sync when connection is
                restored.
              </span>
            </div>
          }
          type="error"
          styles={{
            root: { padding: '8px 12px' },
            close: { fontSize: 16, marginTop: 4 },
            icon: { display: 'none' },
          }}
          banner
          className="border-b-2! border-(--ant-color-error)!"
        />
      ) : (
        <Alert
          description={
            <div className="space-x-2 text-center">
              <WifiOutlined className="text-(--ant-color-warning)!" />
              <span>Your internet connection is slow. Some features may take longer to load.</span>
            </div>
          }
          type="warning"
          styles={{
            root: { padding: '8px 12px' },
            close: { fontSize: 14, marginTop: 4 },
            icon: { display: 'none' },
          }}
          banner
          closable
          className="border-b-2! border-(--ant-color-warning)!"
        />
      )}
    </div>
  )
}

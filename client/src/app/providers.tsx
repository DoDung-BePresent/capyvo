import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ConfigProvider, App as AntdApp } from 'antd'
import { HelmetProvider } from 'react-helmet-async'
import type { ReactNode } from 'react'

import queryClient from '@/lib/query-client'
import { antTheme } from '@/config'
import { useAuthSync } from '@/features/auth/hooks/useAuth'
import { ErrorBoundary, MaintenanceGate } from '@/shared/components'

function AuthSync() {
  useAuthSync()
  return null
}

interface ProvidersProps {
  children: ReactNode
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthSync />
        <ConfigProvider theme={antTheme}>
          <AntdApp>
            <ErrorBoundary>
              <MaintenanceGate>{children}</MaintenanceGate>
            </ErrorBoundary>
          </AntdApp>
        </ConfigProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </HelmetProvider>
  )
}

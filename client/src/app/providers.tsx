import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ConfigProvider, App as AntdApp } from 'antd'
import type { ReactNode } from 'react'
import queryClient from '@/lib/query-client'
import { useAuthSync } from '@/features/auth/hooks/useAuth'

function AuthSync() {
  useAuthSync()
  return null
}

interface ProvidersProps {
  children: ReactNode
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthSync />
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#4F46E5',
          },
        }}
      >
        <AntdApp>{children}</AntdApp>
      </ConfigProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

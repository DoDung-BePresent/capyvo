import { Navigate, Outlet } from 'react-router-dom'
import { Spin } from 'antd'
import { useGetMe } from '@/features/auth/hooks/useAuth'
import type { Role } from '@/features/auth/types'

// Chặn user chưa đăng nhập, redirect về /login
export function ProtectedRoute() {
  const { data: user, isLoading, isError } = useGetMe()

  if (isLoading) return <FullscreenSpin />
  if (isError || !user) return <Navigate to="/login" replace />

  return <Outlet />
}

// Chặn user đã đăng nhập vào /login, redirect về trang chính theo role
export function GuestRoute() {
  const { data: user, isLoading } = useGetMe()

  if (isLoading) return <FullscreenSpin />
  if (user) return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/'} replace />

  return <Outlet />
}

// Chặn route theo role cụ thể
export function RoleRoute({ role }: { role: Role }) {
  const { data: user, isLoading, isError } = useGetMe()

  if (isLoading) return <FullscreenSpin />
  if (isError || !user) return <Navigate to="/login" replace />
  if (user.role !== role) return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/'} replace />

  return <Outlet />
}

function FullscreenSpin() {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
      }}
    >
      <Spin size="large" />
    </div>
  )
}

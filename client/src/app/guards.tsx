import { Navigate, Outlet } from 'react-router-dom'
import { Spin } from 'antd'

/**
 * Hooks
 */
import { useSession } from '@/features/auth/hooks/useSession'
import { useGetMe } from '@/features/auth/hooks/useAuth'

/**
 * Types
 */
import type { Role } from '@/features/auth/types'

export function ProtectedRoute() {
  const { session, isInitializing } = useSession()
  const { data: user, isLoading } = useGetMe(session)

  if (isInitializing || isLoading) return <FullscreenSpin />
  if (!session || !user) return <Navigate to="/login" replace />

  return <Outlet />
}

export function GuestRoute() {
  const { session, isInitializing } = useSession()
  const { data: user, isLoading } = useGetMe(session)

  if (isInitializing || isLoading) return <FullscreenSpin />
  if (session && user) return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/'} replace />

  return <Outlet />
}

export function RoleRoute({ role }: { role: Role }) {
  const { session, isInitializing } = useSession()
  const { data: user, isLoading } = useGetMe(session)

  if (isInitializing || isLoading) return <FullscreenSpin />
  if (!session || !user) return <Navigate to="/login" replace />
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

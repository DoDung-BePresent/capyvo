import { createBrowserRouter } from 'react-router-dom'
import { GuestRoute, ProtectedRoute, RoleRoute } from './guards'

const lazy = (importFn: () => Promise<{ default: React.ComponentType }>) => async () => ({
  Component: (await importFn()).default,
})

const router = createBrowserRouter([
  // Auth callback — không cần guard
  {
    path: '/auth/callback',
    lazy: lazy(() => import('@/features/auth/pages/AuthCallbackPage')),
  },

  // Guest only (đã login thì redirect ra)
  {
    element: <GuestRoute />,
    children: [
      {
        path: '/login',
        lazy: lazy(() => import('@/features/auth/pages/LoginPage')),
      },
    ],
  },

  // User routes
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <RoleRoute role="USER" />,
        children: [
          { path: '/', lazy: lazy(() => import('@/features/exam/pages/HomePage')) },
          { path: '/exam/:examSetId', lazy: lazy(() => import('@/features/exam/pages/ExamPage')) },
          {
            path: '/result/:sessionId',
            lazy: lazy(() => import('@/features/exam/pages/ResultPage')),
          },
        ],
      },
    ],
  },

  // Admin routes
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <RoleRoute role="ADMIN" />,
        children: [
          { path: '/admin', lazy: lazy(() => import('@/features/admin/pages/AdminDashboardPage')) },
          {
            path: '/admin/questions',
            lazy: lazy(() => import('@/features/admin/pages/AdminQuestionsPage')),
          },
        ],
      },
    ],
  },
])

export default router

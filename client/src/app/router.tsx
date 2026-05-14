import { createBrowserRouter } from 'react-router-dom'

/**
 * Components
 */
import { GuestRoute, ProtectedRoute, RoleRoute } from './guards'
import { NotFoundPage, ForbiddenPage } from '@/shared/components'

/**
 * Layouts
 */
import AdminLayout from '@/features/admin/layouts/AdminLayout'
import UserLayout from '@/features/exam/layouts/UserLayout'

const lazy = (importFn: () => Promise<{ default: React.ComponentType }>) => async () => ({
  Component: (await importFn()).default,
})

const router = createBrowserRouter([
  {
    path: '/auth/callback',
    lazy: lazy(() => import('@/features/auth/pages/AuthCallbackPage')),
  },
  {
    element: <GuestRoute />,
    children: [
      {
        path: '/login',
        lazy: lazy(() => import('@/features/auth/pages/LoginPage')),
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <RoleRoute role="USER" />,
        children: [
          {
            element: <UserLayout />,
            children: [
              { path: '/', lazy: lazy(() => import('@/features/exam/pages/HomePage')) },
              {
                path: '/practice',
                lazy: lazy(() => import('@/features/exam/pages/PracticePage/index')),
              },
              {
                path: '/practice/part/:partNumber',
                lazy: lazy(() => import('@/features/exam/pages/PartPracticePage')),
              },
              { path: '/exam', lazy: lazy(() => import('@/features/exam/pages/ExamListPage')) },
              {
                path: '/payment/result',
                lazy: lazy(() => import('@/features/payment/pages/PaymentResultPage')),
              },
              {
                path: '/pricing',
                lazy: lazy(() => import('@/features/payment/pages/PricingPage')),
              },
            ],
          },
          // Fullscreen exam pages — no layout
          {
            path: '/practice/part/:partNumber/question/:questionId',
            lazy: lazy(() => import('@/features/exam/pages/QuestionPracticePage')),
          },
          {
            path: '/exam/:examSetId/test',
            lazy: lazy(() => import('@/features/exam/pages/FullTestPage')),
          },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <RoleRoute role="ADMIN" />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              {
                path: '/admin',
                lazy: lazy(() => import('@/features/admin/pages/AdminDashboardPage')),
              },
              {
                path: '/admin/questions',
                lazy: lazy(() => import('@/features/admin/pages/AdminQuestionsPage')),
              },
              {
                path: '/admin/questions/part/:partNumber',
                lazy: lazy(() => import('@/features/admin/pages/PartQuestionsPage')),
              },
              {
                path: '/admin/exam-sets',
                lazy: lazy(() => import('@/features/admin/pages/AdminExamSetsPage')),
              },
              {
                path: '/admin/exam-sets/:id',
                lazy: lazy(() => import('@/features/admin/pages/ExamSetDetailPage')),
              },
              {
                path: '/admin/topics',
                lazy: lazy(() => import('@/features/admin/pages/TopicManagementPage')),
              },
            ],
          },
        ],
      },
    ],
  },
  // 404 — must be last
  { path: '/403', element: <ForbiddenPage /> },
  { path: '*', element: <NotFoundPage /> },
])

export default router

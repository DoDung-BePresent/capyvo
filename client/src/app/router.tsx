import { createBrowserRouter } from 'react-router-dom'
import { GuestRoute, ProtectedRoute, RoleRoute } from './guards'
import AdminLayout from '@/features/admin/layouts/AdminLayout'
import UserLayout from '@/features/exam/layouts/UserLayout'
import { NotFoundPage, ForbiddenPage } from '@/shared/components'

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
              { path: '/practice', lazy: lazy(() => import('@/features/exam/pages/PracticePage')) },
              {
                path: '/practice/part/:partNumber',
                lazy: lazy(() => import('@/features/exam/pages/PartPracticePage')),
              },
              {
                path: '/practice/part/:partNumber/set/:examSetId',
                lazy: lazy(() => import('@/features/exam/pages/PartSetDetailPage')),
              },
              { path: '/exam', lazy: lazy(() => import('@/features/exam/pages/ExamListPage')) },
              {
                path: '/exam/:examSetId',
                lazy: lazy(() => import('@/features/exam/pages/ExamSetDetailPage')),
              },
              {
                path: '/result/:sessionId',
                lazy: lazy(() => import('@/features/exam/pages/ResultPage')),
              },
              {
                path: '/payment',
                lazy: lazy(() => import('@/features/payment/pages/PaymentPage')),
              },
              {
                path: '/payment/result',
                lazy: lazy(() => import('@/features/payment/pages/PaymentResultPage')),
              },
            ],
          },
          // Fullscreen exam pages — no layout
          {
            path: '/exam/:examSetId/take',
            lazy: lazy(() => import('@/features/exam/pages/ExamPage')),
          },
          {
            path: '/practice/part/:partNumber/set/:examSetId/exam',
            lazy: lazy(() => import('@/features/exam/pages/PartExamPage')),
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
                path: '/admin/instructions',
                lazy: lazy(() => import('@/features/admin/pages/PartInstructionsPage')),
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

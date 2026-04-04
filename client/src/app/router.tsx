import { createBrowserRouter } from 'react-router-dom'

const lazy = (importFn: () => Promise<{ default: React.ComponentType }>) => async () => ({
  Component: (await importFn()).default,
})

const router = createBrowserRouter([
  {
    path: '/',
    lazy: lazy(() => import('@/features/exam/pages/HomePage')),
  },
  {
    path: '/login',
    lazy: lazy(() => import('@/features/auth/pages/LoginPage')),
  },
  {
    path: '/auth/callback',
    lazy: lazy(async () => await import('@/features/auth/pages/AuthCallbackPage')),
  },
  {
    path: '/exam/:examSetId',
    lazy: lazy(() => import('@/features/exam/pages/ExamPage')),
  },
  {
    path: '/result/:sessionId',
    lazy: lazy(() => import('@/features/exam/pages/ResultPage')),
  },
])

export default router

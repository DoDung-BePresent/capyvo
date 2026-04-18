import { Spin } from 'antd'

/**
 * Hooks
 */
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * Libs
 */
import supabase from '@/lib/supabase'

/**
 * Services
 */
import { authService } from '../services/auth.service'

export default function AuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        authService
          .getMe()
          .then((user) => navigate(user.role === 'ADMIN' ? '/admin' : '/', { replace: true }))
          .catch(() => navigate('/', { replace: true }))
      } else if (event === 'SIGNED_OUT') {
        navigate('/login', { replace: true })
      }
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [navigate])

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

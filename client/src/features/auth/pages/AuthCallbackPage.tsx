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
    // Check URL for error parameters (when user cancels or OAuth fails)
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search)
      const error = params.get('error')
      const errorDescription = params.get('error_description')

      // If there's an error (user cancelled or OAuth failed), redirect to login
      if (error) {
        console.log('OAuth error:', error, errorDescription)
        navigate('/login', { replace: true })
        return
      }

      // Try to get the session from the URL hash
      const { error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        console.error('Session error:', sessionError)
        navigate('/login', { replace: true })
        return
      }
    }

    handleCallback()

    // Listen for auth state changes
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

    // Fallback timeout: if nothing happens after 5 seconds, redirect to login
    const timeout = setTimeout(() => {
      navigate('/login', { replace: true })
    }, 5000)

    return () => {
      listener.subscription.unsubscribe()
      clearTimeout(timeout)
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

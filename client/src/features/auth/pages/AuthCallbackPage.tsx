import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Spin, Typography } from 'antd'
import supabase from '@/lib/supabase'

export default function AuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    // Supabase tự động exchange code từ URL thành session
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        navigate('/', { replace: true })
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
        flexDirection: 'column',
        alignItems: 'center',
        marginTop: 160,
        gap: 16,
      }}
    >
      <Spin size="large" />
      <Typography.Text type="secondary">Đang xác thực...</Typography.Text>
    </div>
  )
}

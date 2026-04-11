import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import supabase from '@/lib/supabase'

interface AuthSessionState {
  session: Session | null
  isInitializing: boolean
}

/**
 * Theo dõi Supabase session qua onAuthStateChange.
 * isInitializing = true cho đến khi INITIAL_SESSION event bắn lần đầu.
 * Guards dùng hook này để tránh redirect loop khi page reload.
 */
export function useSession(): AuthSessionState {
  const [state, setState] = useState<AuthSessionState>({
    session: null,
    isInitializing: true,
  })

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ session, isInitializing: false })
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return state
}

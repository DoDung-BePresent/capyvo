import { useEffect, type ReactNode } from 'react'

export function ScrollTop({ children }: { children: ReactNode }) {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
  }, [])

  return <>{children}</>
}

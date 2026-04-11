import { useEffect, useState } from 'react'

interface NetworkStatus {
  isOnline: boolean
  isSlowConnection: boolean
}

export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isSlowConnection, setIsSlowConnection] = useState(false)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Network Information API (Chrome/Edge only)
    const nav = navigator as Navigator & {
      connection?: {
        effectiveType: string
        addEventListener: (e: string, cb: () => void) => void
        removeEventListener: (e: string, cb: () => void) => void
      }
    }
    const connection = nav.connection

    const checkSlow = () => {
      if (connection) {
        setIsSlowConnection(['slow-2g', '2g'].includes(connection.effectiveType))
      }
    }

    checkSlow()
    connection?.addEventListener('change', checkSlow)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      connection?.removeEventListener('change', checkSlow)
    }
  }, [])

  return { isOnline, isSlowConnection }
}

import { useState, useEffect } from 'react'

export type MicPermissionState = 'checking' | 'granted' | 'prompt' | 'denied'

export function useMicPermission() {
  const [permission, setPermission] = useState<MicPermissionState>('checking')

  useEffect(() => {
    navigator.permissions
      .query({ name: 'microphone' as PermissionName })
      .then((result) => {
        setPermission(result.state as MicPermissionState)
        result.onchange = () => setPermission(result.state as MicPermissionState)
      })
      .catch(() => {
        // Firefox doesn't support querying microphone permission — treat as prompt
        setPermission('prompt')
      })
  }, [])

  const requestPermission = async (): Promise<void> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((t) => t.stop())
      setPermission('granted')
    } catch {
      setPermission('denied')
    }
  }

  return { permission, requestPermission }
}

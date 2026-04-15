import { useEffect } from 'react'
import { refreshAccessToken } from '../lib/api'
import { useAuthStore } from '../stores/authStore'

export function useAuthBootstrap() {
  const setSession = useAuthStore((s) => s.setSession)
  const clearSession = useAuthStore((s) => s.clearSession)
  const isAuthInitialized = useAuthStore((s) => s.isAuthInitialized)
  const setAuthInitialized = useAuthStore((s) => s.setAuthInitialized)

  useEffect(() => {
    let isActive = true

    async function bootstrapAuth() {
      try {
        const token = await refreshAccessToken()
        if (!isActive) return

        if (token) {
          setSession(token)
          return
        }

        clearSession()
      } finally {
        if (isActive) setAuthInitialized(true)
      }
    }

    if (!isAuthInitialized) bootstrapAuth()

    return () => {
      isActive = false
    }
  }, [clearSession, isAuthInitialized, setAuthInitialized, setSession])

  return isAuthInitialized
}

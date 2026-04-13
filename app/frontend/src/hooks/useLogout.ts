import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../stores/authStore'
import { buildApiUrl } from '../lib/api'

export function useLogout() {
  const clearSession = useAuthStore((s) => s.clearSession)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await fetch(buildApiUrl('/auth/logout'), {
        method: 'POST',
        credentials: 'include',
      })
    },
    onSettled: () => {
      clearSession()
      queryClient.clear()
    },
  })
}

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../stores/authStore'
import { buildApiUrl } from '../lib/api'

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (body: { username: string; email: string; password: string }) => {
      const res = await fetch(buildApiUrl('/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error('Register failed')
      return res.json() as Promise<{ access_token: string }>
    },
    onSuccess: ({ access_token }) => {
      setSession(access_token)
      queryClient.invalidateQueries()
    },
  })
}

import { useAuthStore } from '../stores/authStore'

let refreshPromise: Promise<string | null> | null = null

export class AuthError extends Error {
  code: 'SESSION_EXPIRED' | 'UNAUTHORIZED'

  constructor(code: 'SESSION_EXPIRED' | 'UNAUTHORIZED', message: string) {
    super(message)
    this.name = 'AuthError'
    this.code = code
  }
}

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = fetch(buildApiUrl('/auth/refresh'), {
      method: 'POST',
      credentials: 'include',
    })
      .then(async (res) => {
        if (!res.ok) return null
        const data = (await res.json()) as { access_token?: unknown }
        return typeof data.access_token === 'string' ? data.access_token : null
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

export async function protectedFetch(input: RequestInfo, init?: RequestInit) {
  const { accessToken, setSession, clearSession } = useAuthStore.getState()

  const headers = new Headers(init?.headers)
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)

  let res = await fetch(input, {
    ...init,
    headers,
    credentials: 'include',
  })

  if (res.status !== 401) return res

  const newToken = await refreshAccessToken()
  if (!newToken) {
    clearSession()
    throw new AuthError('SESSION_EXPIRED', 'Session expired')
  }

  setSession(newToken)

  const retryHeaders = new Headers(init?.headers)
  retryHeaders.set('Authorization', `Bearer ${newToken}`)

  res = await fetch(input, {
    ...init,
    headers: retryHeaders,
    credentials: 'include',
  })

  if (res.status === 401) {
    clearSession()
    throw new AuthError('UNAUTHORIZED', 'Unauthorized')
  }

  return res
}

export function buildApiUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  let baseUrl = import.meta.env.VITE_API_BASE_URL as string
  baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl

  return `${baseUrl}${normalizedPath}`
}

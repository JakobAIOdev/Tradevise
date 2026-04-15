import { jwtDecode } from 'jwt-decode'
import { create } from 'zustand'

type JwtPayload = {
  sub: string
  username: string
  email: string
  exp: number
}

type AuthUser = {
  id: string
  username: string
  email: string
}

type AuthState = {
  accessToken: string | null
  user: AuthUser | null
  isAuthenticated: boolean
  isAuthInitialized: boolean
  setSession: (token: string) => void
  clearSession: () => void
  setAuthInitialized: (value: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,
  isAuthInitialized: false,
  setSession: (token) => {
    const payload = jwtDecode<JwtPayload>(token)

    set({
      accessToken: token,
      user: {
        id: payload.sub,
        username: payload.username,
        email: payload.email,
      },
      isAuthenticated: true,
    })
  },
  clearSession: () =>
    set({
      accessToken: null,
      user: null,
      isAuthenticated: false,
    }),
  setAuthInitialized: (value) =>
    set({
      isAuthInitialized: value,
    }),
}))

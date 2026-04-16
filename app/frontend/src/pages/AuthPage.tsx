import { useEffect, useState } from 'react'
import type { SubmitEventHandler } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLogin } from '../hooks/useLogin'
import { useRegister } from '../hooks/useRegister'
import { useAuthStore } from '../stores/authStore'

type AuthMode = 'login' | 'register'

const initialLoginForm = {
  username: '',
  password: '',
}

const initialRegisterForm = {
  username: '',
  email: '',
  password: '',
}

export default function AuthPage() {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const [mode, setMode] = useState<AuthMode>('login')
  const [loginForm, setLoginForm] = useState(initialLoginForm)
  const [registerForm, setRegisterForm] = useState(initialRegisterForm)

  const loginMutation = useLogin()
  const registerMutation = useRegister()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/home', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const errorMessage =
    (mode === 'login' ? loginMutation.error : registerMutation.error)?.message ?? null

  const isPending = mode === 'login' ? loginMutation.isPending : registerMutation.isPending

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault()

    if (mode === 'login') {
      loginMutation.mutate(loginForm)
      return
    }

    registerMutation.mutate(registerForm)
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-18 py-32">
      <div className="w-full max-w-sm">
        <div className="mb-15 flex gap-10">
          <button type="button" onClick={() => setMode('login')} className="px-15 py-10">
            Login
          </button>
          <button type="button" onClick={() => setMode('register')} className="px-15 py-10">
            Register
          </button>
        </div>

        <form className="space-y-15" onSubmit={handleSubmit}>
          <label className="block space-y-8">
            <span className="text-small text-muted">Username</span>
            <input
              required
              value={mode === 'login' ? loginForm.username : registerForm.username}
              onChange={(event) =>
                mode === 'login'
                  ? setLoginForm((current) => ({ ...current, username: event.target.value }))
                  : setRegisterForm((current) => ({ ...current, username: event.target.value }))
              }
              className="w-full px-15 py-12 bg-surface border border-border"
            />
          </label>

          {mode === 'register' && (
            <label className="block space-y-8">
              <span className="text-small text-muted">Email</span>
              <input
                required
                type="email"
                value={registerForm.email}
                onChange={(event) =>
                  setRegisterForm((current) => ({ ...current, email: event.target.value }))
                }
                className="w-full px-15 py-12 bg-surface border border-border"
              />
            </label>
          )}

          <label className="block space-y-8">
            <span className="text-small text-muted">Password</span>
            <input
              required
              type="password"
              value={mode === 'login' ? loginForm.password : registerForm.password}
              onChange={(event) =>
                mode === 'login'
                  ? setLoginForm((current) => ({ ...current, password: event.target.value }))
                  : setRegisterForm((current) => ({ ...current, password: event.target.value }))
              }
              className="w-full px-15 py-12 bg-surface border border-border"
            />
          </label>

          {errorMessage && <p className="text-small text-error">{errorMessage}</p>}

          <button
            type="submit"
            disabled={isPending}
            className="w-full px-15 py-12 disabled:opacity-60"
          >
            {isPending ? 'Loading...' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  )
}

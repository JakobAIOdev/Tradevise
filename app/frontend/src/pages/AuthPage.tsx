import { useEffect, useState } from 'react'
import type { SubmitEventHandler } from 'react'
import { ChevronRight, LoaderCircle, TrendingUp, Trophy, UsersRound } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useLogin } from '../hooks/useLogin'
import { useRegister } from '../hooks/useRegister'
import { useAuthStore } from '../stores/authStore'
import Button from '../components/Button'
import TextField from '../components/TextField'

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

const marketingFeatures = [
  {
    title: 'Real market data',
    description: 'Trade stocks with live realtime data - without risking a single cent.',
    icon: TrendingUp,
  },
  {
    title: 'Global Leaderboard',
    description: 'Compete with traders worldwide. Climb the seasonal rankings.',
    icon: Trophy,
  },
  {
    title: 'Trading Groups',
    description: "Create private leagues with friends and track who's on top.",
    icon: UsersRound,
  },
]

const authCopy: Record<
  AuthMode,
  {
    title: string
    subtitle: string
    submitLabel: string
    pendingLabel: string
    switchPrompt: string
    switchLabel: string
    switchTo: string
  }
> = {
  login: {
    title: 'Welcome back',
    subtitle: 'Sign in to continue trading.',
    submitLabel: 'Sign in',
    pendingLabel: 'Signing in...',
    switchPrompt: 'New to Tradevise?',
    switchLabel: 'Sign up',
    switchTo: '/register',
  },
  register: {
    title: 'Create your Account',
    subtitle: 'Start with 10.000 € in virtual capital.',
    submitLabel: 'Create Account',
    pendingLabel: 'Creating...',
    switchPrompt: 'Already have an account?',
    switchLabel: 'Sign in',
    switchTo: '/login',
  },
}

const AuthPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const mode: AuthMode = location.pathname === '/register' ? 'register' : 'login'
  const copy = authCopy[mode]

  const [loginForm, setLoginForm] = useState(initialLoginForm)
  const [registerForm, setRegisterForm] = useState(initialRegisterForm)

  const loginMutation = useLogin()
  const registerMutation = useRegister()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true })
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
    <main className="grid min-h-screen bg-bg text-text lg:grid-cols-2">
      <section className="order-2 bg-text px-32 py-40 text-surface sm:px-48 lg:relative lg:order-1 lg:flex lg:h-screen lg:flex-col lg:overflow-y-auto lg:px-64 lg:py-48 xl:px-80">
        <p className="text-h2-mobile leading-tight font-bold lg:absolute lg:top-48 lg:left-64 lg:text-h2 xl:left-80">
          Tradevise
        </p>

        <div className="w-full lg:my-auto">
          <div className="mt-40 lg:mt-0">
            <h1 className="max-w-2xl text-h1-mobile leading-tight font-bold lg:text-h1">
              Master the markets.
              <br />
              Without the risk.
            </h1>
            <p className="mt-15 max-w-xl text-body-mobile leading-snug text-surface lg:mt-18 lg:text-body">
              Join a large community of traders sharpening their skills on Tradevise.
            </p>
          </div>

          <div className="mt-32 space-y-25 lg:mt-48 lg:space-y-32">
            {marketingFeatures.map(({ title, description, icon: Icon }) => (
              <div key={title} className="flex max-w-2xl gap-25">
                <Icon
                  aria-hidden="true"
                  size={28}
                  strokeWidth={1.35}
                  className="mt-25 text-surface"
                />
                <div>
                  <h2 className="text-h3-mobile leading-tight font-bold lg:text-h3">{title}</h2>
                  <p className="mt-8 max-w-xl text-body-mobile leading-snug text-surface">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="order-1 flex px-32 py-40 sm:px-48 lg:order-2 lg:h-screen lg:min-h-0 lg:overflow-y-auto lg:px-80 lg:py-48">
        <div className="mx-auto w-full max-w-md lg:my-auto">
          <h2 className="text-h1-mobile leading-tight font-bold text-text lg:whitespace-nowrap lg:text-h1">
            {copy.title}
          </h2>
          <p className="mt-15 text-body-mobile leading-snug text-text lg:mt-18 lg:text-body">
            {copy.subtitle}
          </p>

          <form className="mt-40 lg:mt-60" onSubmit={handleSubmit}>
            <div className="space-y-25 lg:space-y-40">
              <TextField
                id={`${mode}-username`}
                label="Username"
                required
                autoComplete="username"
                placeholder="Your trading name"
                labelClassName="font-bold text-text"
                inputClassName="w-full px-25 py-12"
                value={mode === 'login' ? loginForm.username : registerForm.username}
                onChange={(event) =>
                  mode === 'login'
                    ? setLoginForm((current) => ({ ...current, username: event.target.value }))
                    : setRegisterForm((current) => ({ ...current, username: event.target.value }))
                }
              />

              {mode === 'register' && (
                <TextField
                  id="register-email"
                  label="Email"
                  required
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  labelClassName="font-bold text-text"
                  inputClassName="w-full px-25 py-12"
                  value={registerForm.email}
                  onChange={(event) =>
                    setRegisterForm((current) => ({ ...current, email: event.target.value }))
                  }
                />
              )}

              <TextField
                id={`${mode}-password`}
                label="Password"
                required
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                placeholder="********"
                labelClassName="font-bold text-text"
                inputClassName="w-full px-25 py-12"
                value={mode === 'login' ? loginForm.password : registerForm.password}
                onChange={(event) =>
                  mode === 'login'
                    ? setLoginForm((current) => ({ ...current, password: event.target.value }))
                    : setRegisterForm((current) => ({ ...current, password: event.target.value }))
                }
              />
            </div>

            {errorMessage && <p className="mt-18 text-small text-error">{errorMessage}</p>}

            <Button
              type="submit"
              size="none"
              disabled={isPending}
              fullWidth
              className="mt-32 rounded-lg px-25 py-12 text-body-mobile lg:mt-40"
              trailing={
                isPending ? (
                  <LoaderCircle aria-hidden="true" size={18} className="animate-spin" />
                ) : (
                  <ChevronRight aria-hidden="true" size={19} strokeWidth={2.4} />
                )
              }
            >
              {isPending ? copy.pendingLabel : copy.submitLabel}
            </Button>
          </form>

          <p className="mt-40 text-body-mobile leading-snug text-text lg:mt-60 lg:text-body">
            {copy.switchPrompt}{' '}
            <Link to={copy.switchTo} className="font-bold text-text transition hover:text-muted">
              {copy.switchLabel}
            </Link>
          </p>
        </div>
      </section>
    </main>
  )
}

export default AuthPage

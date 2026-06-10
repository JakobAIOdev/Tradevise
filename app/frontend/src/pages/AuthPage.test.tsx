import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import AuthPage from './AuthPage'

const mocks = vi.hoisted(() => ({
  login: vi.fn(),
  register: vi.fn(),
  loginPending: false,
  registerPending: false,
  loginError: null as Error | null,
  registerError: null as Error | null,
  isAuthenticated: false,
}))

vi.mock('../hooks/useLogin', () => ({
  useLogin: () => ({
    mutate: mocks.login,
    isPending: mocks.loginPending,
    error: mocks.loginError,
  }),
}))

vi.mock('../hooks/useRegister', () => ({
  useRegister: () => ({
    mutate: mocks.register,
    isPending: mocks.registerPending,
    error: mocks.registerError,
  }),
}))

vi.mock('../stores/authStore', () => ({
  useAuthStore: (selector: (state: { isAuthenticated: boolean }) => unknown) =>
    selector({ isAuthenticated: mocks.isAuthenticated }),
}))

function renderAuthPage(path = '/login') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('AuthPage', () => {
  beforeEach(() => {
    mocks.login.mockReset()
    mocks.register.mockReset()
    mocks.loginPending = false
    mocks.registerPending = false
    mocks.loginError = null
    mocks.registerError = null
    mocks.isAuthenticated = false
  })

  it('submits the login form', () => {
    renderAuthPage('/login')

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'jakob' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'secret123' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    expect(mocks.login).toHaveBeenCalledWith({
      username: 'jakob',
      password: 'secret123',
    })
  })

  it('submits the register form', () => {
    renderAuthPage('/register')

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'new-user' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'new@example.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'secret123' } })
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    expect(mocks.register).toHaveBeenCalledWith({
      username: 'new-user',
      email: 'new@example.com',
      password: 'secret123',
    })
  })

  it('links from login to register', () => {
    renderAuthPage('/login')

    expect(screen.getByRole('link', { name: /sign up/i })).toHaveAttribute('href', '/register')
  })

  it('shows the login pending state', () => {
    mocks.loginPending = true

    renderAuthPage('/login')

    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled()
  })

  it('shows login errors', () => {
    mocks.loginError = new Error('Login failed')

    renderAuthPage('/login')

    expect(screen.getByText('Login failed')).toBeInTheDocument()
  })
})

import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import PortfolioSwitcherModal from './PortfolioSwitcherModal'

const mocks = vi.hoisted(() => ({
  onClose: vi.fn(),
  showMessage: vi.fn(),
  createPortfolio: vi.fn(),
  setActivePortfolio: vi.fn(),
  deletePortfolio: vi.fn(),
  updatePortfolio: vi.fn(),
  logout: vi.fn(),
}))

vi.mock('../contexts/toast', () => ({
  useToast: () => ({
    showMessage: mocks.showMessage,
  }),
}))

vi.mock('../hooks/useLogout', () => ({
  useLogout: () => ({
    mutate: mocks.logout,
    isPending: false,
  }),
}))

vi.mock('../hooks/usePortfolios', () => ({
  usePortfolios: () => ({
    data: {
      activePortfolioId: 'portfolio-1',
      portfolios: [
        {
          id: 'portfolio-1',
          name: 'Main Portfolio',
          cash: 1000,
          totalValue: 1500,
          isDefault: true,
          isActive: true,
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
        {
          id: 'portfolio-2',
          name: 'Growth Portfolio',
          cash: 500,
          totalValue: 800,
          isDefault: false,
          isActive: false,
          createdAt: '2026-01-02',
          updatedAt: '2026-01-02',
        },
      ],
    },
  }),
  useCreatePortfolio: () => ({
    mutate: mocks.createPortfolio,
    isPending: false,
  }),
  useDeletePortfolio: () => ({
    mutate: mocks.deletePortfolio,
    isPending: false,
  }),
  useSetActivePortfolio: () => ({
    mutate: mocks.setActivePortfolio,
    isPending: false,
  }),
  useUpdatePortfolio: () => ({
    mutate: mocks.updatePortfolio,
    isPending: false,
  }),
}))

function renderPortfolioSwitcherModal() {
  return render(<PortfolioSwitcherModal isOpen={true} onClose={mocks.onClose} />)
}

describe('PortfolioSwitcherModal', () => {
  beforeEach(() => {
    mocks.onClose.mockReset()
    mocks.showMessage.mockReset()
    mocks.createPortfolio.mockReset()
    mocks.setActivePortfolio.mockReset()
    mocks.deletePortfolio.mockReset()
    mocks.updatePortfolio.mockReset()
    mocks.logout.mockReset()
  })

  it('shows the portfolio list', () => {
    renderPortfolioSwitcherModal()

    expect(screen.getByText('Main Portfolio')).toBeInTheDocument()
    expect(screen.getByText('Growth Portfolio')).toBeInTheDocument()
  })

  it('switches to another portfolio when the user clicks it', () => {
    renderPortfolioSwitcherModal()

    fireEvent.click(screen.getByText('Growth Portfolio'))

    expect(mocks.setActivePortfolio).toHaveBeenCalledWith('portfolio-2', expect.any(Object))
  })

  it('does not create a portfolio with an empty name', () => {
    renderPortfolioSwitcherModal()

    fireEvent.click(screen.getByRole('button', { name: /create portfolio/i }))

    expect(mocks.createPortfolio).not.toHaveBeenCalled()
  })

  it('creates a portfolio with the entered name', () => {
    renderPortfolioSwitcherModal()

    fireEvent.change(screen.getByPlaceholderText(/new portfolio name/i), {
      target: { value: 'Dividend Portfolio' },
    })

    fireEvent.click(screen.getByRole('button', { name: /create portfolio/i }))

    expect(mocks.createPortfolio).toHaveBeenCalledWith('Dividend Portfolio', expect.any(Object))
  })
})

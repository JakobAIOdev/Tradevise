import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import BuyModalContent from './BuyModalContent'

const mocks = vi.hoisted(() => ({
  mutate: vi.fn(),
  onClose: vi.fn(),
  portfolioCash: 1000,
}))

vi.mock('../../hooks/usePortfolio', () => ({
  usePortfolio: () => ({
    data: {
      cash: mocks.portfolioCash,
    },
  }),
}))

vi.mock('../../hooks/useTradeStock', () => ({
  useTradeStock: () => ({
    mutate: mocks.mutate,
    isPending: false,
  }),
}))

vi.mock('../../contexts/toast', () => ({
  useToast: () => ({
    showMessage: vi.fn(),
  }),
}))

function renderBuyModalContent() {
  return render(
    <BuyModalContent onClose={mocks.onClose} symbol="AAPL" name="Apple" currentPrice={125} />,
  )
}

describe('BuyModalContent', () => {
  beforeEach(() => {
    mocks.mutate.mockReset()
    mocks.onClose.mockReset()
    mocks.portfolioCash = 1000
  })

  it('shows the default buy amount and submits one share', () => {
    renderBuyModalContent()

    expect(screen.getByText('Available cash')).toBeInTheDocument()
    expect(screen.getByText('1.000,00 €')).toBeInTheDocument()
    expect(screen.getByText('After order')).toBeInTheDocument()
    expect(screen.getByText('875,00 €')).toBeInTheDocument()
    expect(screen.getByLabelText(/amount/i)).toHaveValue('125')
    expect(screen.getByText('1 shares')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /^buy$/i }))

    expect(mocks.mutate).toHaveBeenCalledWith({ symbol: 'AAPL', quantity: 1 }, expect.any(Object))
  })

  it('does not allow buying more than the available cash', () => {
    mocks.portfolioCash = 50

    renderBuyModalContent()

    expect(screen.getByRole('button', { name: /^buy$/i })).toBeDisabled()

    expect(mocks.mutate).not.toHaveBeenCalled()
  })

  it('can buy by entering a number of shares', () => {
    renderBuyModalContent()

    fireEvent.click(screen.getByRole('button', { name: /shares/i }))
    fireEvent.change(screen.getByLabelText(/shares/i), { target: { value: '3.5' } })

    expect(screen.getByText('437,50 € total')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /^buy$/i }))

    expect(mocks.mutate).toHaveBeenCalledWith({ symbol: 'AAPL', quantity: 3.5 }, expect.any(Object))
  })

  it('disables the buy button for invalid input', () => {
    renderBuyModalContent()

    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: 'abc' } })

    expect(screen.getByRole('button', { name: /^buy$/i })).toBeDisabled()
  })
})

import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import SellModalContent from './SellModalContent'

const mocks = vi.hoisted(() => ({
  mutate: vi.fn(),
  onClose: vi.fn(),
  holdings: [
    {
      id: 'holding-1',
      symbol: 'AAPL',
      quantity: 8,
      averagePrice: 90,
      currentPrice: 100,
      previousClose: 98,
      marketValue: 800,
      profitLoss: 80,
      todayChange: 16,
      todayBaselineValue: 784,
    },
  ],
}))

vi.mock('../../hooks/usePortfolio', () => ({
  usePortfolio: () => ({
    data: {
      cash: 500,
      holdings: mocks.holdings,
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

function renderSellModalContent() {
  return render(
    <SellModalContent onClose={mocks.onClose} symbol="AAPL" name="Apple" currentPrice={100} />,
  )
}

describe('SellModalContent', () => {
  beforeEach(() => {
    mocks.mutate.mockReset()
    mocks.onClose.mockReset()
    mocks.holdings = [
      {
        id: 'holding-1',
        symbol: 'AAPL',
        quantity: 8,
        averagePrice: 90,
        currentPrice: 100,
        previousClose: 98,
        marketValue: 800,
        profitLoss: 80,
        todayChange: 16,
        todayBaselineValue: 784,
      },
    ]
  })

  it('sells 25 percent of the holding by default', () => {
    renderSellModalContent()

    expect(screen.getByText('8 shares held')).toBeInTheDocument()
    expect(screen.getByText('2 shares')).toBeInTheDocument()
    expect(screen.getByText('200,00 € total')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /^sell$/i }))

    expect(mocks.mutate).toHaveBeenCalledWith({ symbol: 'AAPL', quantity: 2 }, expect.any(Object))
  })

  it('can sell by entering a number of shares', () => {
    renderSellModalContent()

    fireEvent.click(screen.getByRole('button', { name: /shares/i }))
    fireEvent.change(screen.getByLabelText(/shares/i), { target: { value: '3.5' } })

    expect(screen.getByText('350,00 € total')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /^sell$/i }))

    expect(mocks.mutate).toHaveBeenCalledWith({ symbol: 'AAPL', quantity: 3.5 }, expect.any(Object))
  })

  it('does not allow selling more shars than ownd', () => {
    renderSellModalContent()

    fireEvent.click(screen.getByRole('button', { name: /shares/i }))
    fireEvent.change(screen.getByLabelText(/shares/i), { target: { value: '20' } })

    expect(screen.getByRole('button', { name: /^sell$/i })).toBeDisabled()
  })

  it('disables selling when the stock is not in the portfolio', () => {
    mocks.holdings = []

    renderSellModalContent()

    expect(screen.getByText('0 shares held')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^sell$/i })).toBeDisabled()

    expect(mocks.mutate).not.toHaveBeenCalled()
  })
})

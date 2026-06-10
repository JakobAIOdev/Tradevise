import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import WatchlistSection from './WatchlistSection'

const mocks = vi.hoisted(() => ({
  stocks: [
    {
      name: 'Apple',
      ticker: 'AAPL',
      change: 1.25,
      logo: '',
      price: 100,
    },
  ],
  isLoading: false,
  isError: false,
}))

vi.mock('../../hooks/useWatchlistStocks', () => ({
  useWatchlistStocks: () => ({
    data: mocks.stocks,
    isLoading: mocks.isLoading,
    isError: mocks.isError,
  }),
}))

function renderWatchlistSection() {
  return render(
    <MemoryRouter>
      <WatchlistSection />
    </MemoryRouter>,
  )
}

describe('WatchlistSection', () => {
  beforeEach(() => {
    mocks.stocks = [
      {
        name: 'Apple',
        ticker: 'AAPL',
        change: 1.25,
        logo: '',
        price: 100,
      },
    ]
    mocks.isLoading = false
    mocks.isError = false
  })

  it('shows stocks fom the watchlist', () => {
    renderWatchlistSection()

    expect(screen.getByRole('heading', { name: /watchlist/i })).toBeInTheDocument()
    expect(screen.getByText('Apple')).toBeInTheDocument()
    expect(screen.getByText('AAPL')).toBeInTheDocument()
  })

  it('shows a loading message', () => {
    mocks.stocks = []
    mocks.isLoading = true

    renderWatchlistSection()

    expect(screen.getByText('Loading watchlist...')).toBeInTheDocument()
  })

  it('shows an empty watchlist message', () => {
    mocks.stocks = []

    renderWatchlistSection()

    expect(screen.getByText('Add stocks with the star icon to see them here.')).toBeInTheDocument()
  })

  it('shows an error messsage', () => {
    mocks.stocks = []
    mocks.isError = true

    renderWatchlistSection()

    expect(screen.getByText('Watchlist could not be loaded.')).toBeInTheDocument()
  })
})

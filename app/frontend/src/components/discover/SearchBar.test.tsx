import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SearchBar } from './SearchBar'

const mocks = vi.hoisted(() => ({
  results: [
    {
      symbol: 'AAPL',
      name: 'Apple',
      type: 'STOCK',
      logoUrl: null,
    },
  ],
  isLoading: false,
  isFetching: false,
  isError: false,
}))

vi.mock('../../hooks/useStockSearch', () => ({
  useStockSearch: () => ({
    data: mocks.results,
    isLoading: mocks.isLoading,
    isFetching: mocks.isFetching,
    isError: mocks.isError,
  }),
}))

function renderSearchBar() {
  return render(
    <MemoryRouter>
      <SearchBar />
    </MemoryRouter>,
  )
}

describe('SearchBar', () => {
  beforeEach(() => {
    mocks.results = [
      {
        symbol: 'AAPL',
        name: 'Apple',
        type: 'STOCK',
        logoUrl: null,
      },
    ]
    mocks.isLoading = false
    mocks.isFetching = false
    mocks.isError = false
  })

  it('shows search results while typing', () => {
    renderSearchBar()

    fireEvent.change(screen.getByLabelText(/search assets/i), { target: { value: 'apple' } })

    expect(screen.getByText('Apple')).toBeInTheDocument()
    expect(screen.getByText('AAPL')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /apple/i })).toHaveAttribute('href', '/detail/AAPL')
  })

  it('clears the search input', () => {
    renderSearchBar()

    const input = screen.getByLabelText(/search assets/i)
    fireEvent.change(input, { target: { value: 'apple' } })
    fireEvent.click(screen.getByRole('button'))

    expect(input).toHaveValue('')
    expect(screen.queryByText('Apple')).not.toBeInTheDocument()
  })

  it('shows a loading message', () => {
    mocks.results = []
    mocks.isLoading = true

    renderSearchBar()

    fireEvent.change(screen.getByLabelText(/search assets/i), { target: { value: 'tesla' } })

    expect(screen.getByText('Searching...')).toBeInTheDocument()
  })

  it('shows a message when no result was found', () => {
    mocks.results = []

    renderSearchBar()

    fireEvent.change(screen.getByLabelText(/search assets/i), { target: { value: 'xyz' } })

    expect(screen.getByText('No result for „xyz“')).toBeInTheDocument()
  })

  it('shows an error message', () => {
    mocks.results = []
    mocks.isError = true

    renderSearchBar()

    fireEvent.change(screen.getByLabelText(/search assets/i), { target: { value: 'apple' } })

    expect(screen.getByText('Search not available.')).toBeInTheDocument()
  })
})

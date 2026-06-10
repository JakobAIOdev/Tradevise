import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import FavoriteButton from './FavoriteButton'

describe('FavoriteButton', () => {
  it('adds a stock to the watchlist', () => {
    const onToggle = vi.fn()

    render(<FavoriteButton isFavorite={false} onToggle={onToggle} />)

    const button = screen.getByRole('button', { name: /add to watchlist/i })
    fireEvent.click(button)

    expect(button).toHaveAttribute('aria-pressed', 'false')
    expect(onToggle).toHaveBeenCalledOnce()
  })

  it('removes a stock from the watchlist', () => {
    const onToggle = vi.fn()

    render(<FavoriteButton isFavorite onToggle={onToggle} />)

    const button = screen.getByRole('button', { name: /remove from watchlist/i })
    fireEvent.click(button)

    expect(button).toHaveAttribute('aria-pressed', 'true')
    expect(onToggle).toHaveBeenCalledOnce()
  })

  it('is disabled while the watchlist is updating', () => {
    const onToggle = vi.fn()

    render(<FavoriteButton isFavorite={false} isPending onToggle={onToggle} />)

    expect(screen.getByRole('button', { name: /add to watchlist/i })).toBeDisabled()
  })
})

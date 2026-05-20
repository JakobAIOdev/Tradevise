import StockGrid from '../discover/StockGrid'
import { useWatchlistStocks } from '../../hooks/useWatchlistStocks'

export default function WatchlistSection() {
  const { data: stocks = [], isLoading, isError } = useWatchlistStocks()
  const isEmpty = !isLoading && !isError && stocks.length === 0

  return (
    <section className="mt-15">
      <StockGrid title="Watchlist" stocks={stocks} />
      {isLoading && <p className="mt-15 text-small text-muted text-center">Loading watchlist...</p>}
      {isError && (
        <p className="mt-15 text-small text-error text-center">Watchlist could not be loaded.</p>
      )}
      {isEmpty && (
        <p className="mt-15 text-small text-muted text-center">
          Add stocks with the star icon to see them here.
        </p>
      )}
    </section>
  )
}

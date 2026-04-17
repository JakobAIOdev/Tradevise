import PageTitle from '../components/PageTitle'
import { SearchBar } from '../components/discover/SearchBar'
import StockGrid from '../components/discover/StockGrid'
import { MOCK_CRYPTOS } from '../mock/stocks'
import { useDiscoverStocks } from '../hooks/useDiscoverStocks'
import { Link } from 'react-router-dom'

export default function DiscoverPage() {
  const { data: stocks = [], isError, isLoading } = useDiscoverStocks()

  return (
    <div>
      <PageTitle title="Discover" />
      <div>
        <SearchBar className="mb-60 w-full max-w-140" />
      </div>
      <div className="flex flex-col gap-60">
        <StockGrid title="Popular Stocks" stocks={stocks} />
        {isLoading && <p className="text-small text-muted">Loading live stocks...</p>}
        {isError && (
          <p className="text-small text-error">
            Live stocks could not be loaded. <Link to="/login">Open dev login</Link>.
          </p>
        )}
        <StockGrid title="Popular Cryptos" stocks={MOCK_CRYPTOS} interactive={false} />
      </div>
    </div>
  )
}

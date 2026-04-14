import PageTitle from '../components/PageTitle'
import { SearchBar } from '../components/discover/SearchBar'
import StockGrid from '../components/discover/StockGrid'
import { MOCK_CRYPTOS, MOCK_STOCKS } from '../mock/stocks'

export default function DiscoverPage() {
  return (
    <div>
      <PageTitle title="Discover" />
      <div>
        <SearchBar className="mb-60 w-full max-w-140" />
      </div>
      <div className="flex flex-col gap-60">
        <StockGrid title="Popular Stocks" stocks={MOCK_STOCKS} />
        <StockGrid title="Popular Cryptos" stocks={MOCK_CRYPTOS} />
      </div>
    </div>
  )
}

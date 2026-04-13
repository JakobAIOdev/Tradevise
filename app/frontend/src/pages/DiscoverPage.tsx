import PageTitle from '../components/PageTitle'
import StockGrid from '../components/discover/StockGrid'
import { MOCK_CRYPTOS, MOCK_STOCKS } from '../mock/stocks'

export default function DiscoverPage() {
  return (
    <div>
      <PageTitle title="Discover" />
      <div className="flex flex-col gap-60">
        <StockGrid title="Popular Stocks" stocks={MOCK_STOCKS} />
        <StockGrid title="Popular Cryptos" stocks={MOCK_CRYPTOS} />
      </div>
    </div>
  )
}

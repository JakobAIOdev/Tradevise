import StatCard from '../components/StatCard'
import { BarChart2, TrendingUp, Wallet } from 'lucide-react'
import { getTrend } from '../utils/trend'
import PageTitle from '../components/PageTitle'
import { formatMoney, formatSignedMoney, formatSignedPercent } from '../utils/format'
import StockChart from '../components/chart/StockChart'
import { useHomePortfolio } from '../hooks/useHomePortfolio'
import WatchlistSection from '../components/watchlist/WatchlistSection'

export default function HomePage() {
  const {
    range,
    setRange,
    portfolio,
    portfolioChart,
    isLoading,
    isError,
    cash,
    totalValue,
    rangeLabel,
    rangeChange,
    rangeChangePercent,
    totalProfitLoss,
  } = useHomePortfolio()
  const loadingValue = isLoading ? 'Loading...' : '0.00 €'
  const errorSub = isError ? 'Could not load portfolio' : undefined

  return (
    <div className="flex flex-col gap-25">
      <PageTitle title="Home" />
      <div className="grid grid-cols-1 gap-25 md:grid-cols-2 xl:grid-cols-3">
        <StatCard
          icon={TrendingUp}
          label={rangeLabel}
          value={portfolio ? formatSignedMoney(rangeChange) : loadingValue}
          valueTrend={portfolio ? getTrend(rangeChange) : 'neutral'}
          sub={
            errorSub ??
            (portfolio ? formatSignedPercent(rangeChangePercent) : 'Selected range performance')
          }
          subTrend={portfolio ? getTrend(rangeChange) : 'neutral'}
        />
        <StatCard
          icon={BarChart2}
          label="Cash left"
          value={portfolio ? formatMoney(cash) : loadingValue}
          valueTrend="neutral"
          sub={errorSub ?? 'Available'}
          subTrend="neutral"
        />
        <div className="h-full md:col-span-2 xl:col-span-1">
          <StatCard
            icon={Wallet}
            label="Total Portfolio"
            value={portfolio ? formatMoney(totalValue) : loadingValue}
            valueTrend="neutral"
            sub={errorSub ?? formatSignedMoney(totalProfitLoss)}
            subTrend={portfolio ? getTrend(totalProfitLoss) : 'neutral'}
          />
        </div>
      </div>

      <div className="h-111.5">
        <StockChart
          ticker="PORTFOLIO"
          range={range}
          onRangeChange={setRange}
          data={portfolioChart}
        />
      </div>

      <WatchlistSection />
    </div>
  )
}

import StatCard from '../components/StatCard'
import { BarChart2, TrendingUp, Wallet } from 'lucide-react'
import { getTrend } from '../utils/trend'
import PageTitle from '../components/PageTitle'
import { formatMoney, formatSignedMoney, formatSignedPercent } from '../utils/format'
import StockChart from '../components/chart/StockChart'
import { useHomePortfolio } from '../hooks/useHomePortfolio'

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
      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-25">
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
          icon={Wallet}
          label="Total Portfolio"
          value={portfolio ? formatMoney(totalValue) : loadingValue}
          valueTrend="neutral"
          sub={errorSub ?? formatSignedMoney(totalProfitLoss)}
          subTrend={portfolio ? getTrend(totalProfitLoss) : 'neutral'}
        />
        <StatCard
          icon={BarChart2}
          label="Cash left"
          value={portfolio ? formatMoney(cash) : loadingValue}
          valueTrend="neutral"
          sub={errorSub ?? 'Available'}
          subTrend="neutral"
        />
      </div>

      <div className="flex flex-col gap-10">
        <p className="text-h2 text-text">Portfolio Performance</p>
        <div className="h-111.5">
          <StockChart
            ticker="PORTFOLIO"
            range={range}
            onRangeChange={setRange}
            data={portfolioChart}
          />
        </div>
      </div>
    </div>
  )
}

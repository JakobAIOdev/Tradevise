import StatCard from '../components/StatCard'
import { BarChart2, TrendingUp, Wallet } from 'lucide-react'
import { getTrend } from '../utils/trend'
import PageTitle from '../components/PageTitle'
import { usePortfolio } from '../hooks/usePortfolio'
import { formatMoney, formatSignedMoney, formatSignedPercent } from '../utils/format'

const INITIAL_PORTFOLIO_VALUE = 10000

export default function HomePage() {
  const { data: portfolio, isLoading, isError } = usePortfolio()

  const cash = portfolio?.cash ?? 0
  const totalValue = portfolio?.totalValue ?? 0
  const todayChange = portfolio?.todayChange ?? 0
  const todayChangePercent = portfolio?.todayChangePercent ?? 0
  const totalProfitLoss = totalValue - INITIAL_PORTFOLIO_VALUE
  const loadingValue = isLoading ? 'Loading...' : '0.00 €'
  const errorSub = isError ? 'Could not load portfolio' : undefined

  return (
    <>
      <PageTitle title="Home" />
      <div className="flex gap-25">
        <StatCard
          icon={TrendingUp}
          label="Today"
          value={portfolio ? formatSignedMoney(todayChange) : loadingValue}
          valueTrend={portfolio ? getTrend(todayChange) : 'neutral'}
          sub={errorSub ?? (portfolio ? formatSignedPercent(todayChangePercent) : 'Daily performance')}
          subTrend={portfolio ? getTrend(todayChange) : 'neutral'}
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
    </>
  )
}

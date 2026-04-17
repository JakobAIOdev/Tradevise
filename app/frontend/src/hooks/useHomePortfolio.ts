import { useMemo, useState } from 'react'
import type { ChartRange } from '../types/chart'
import { usePortfolio } from './usePortfolio'
import { usePortfolioChart } from './usePortfolioChart'
import { usePortfolioLive } from './usePortfolioLive'

const INITIAL_PORTFOLIO_VALUE = 10000

export function useHomePortfolio() {
  const [range, setRange] = useState<ChartRange>('intraday')
  const { data: portfolio, isLoading, isError } = usePortfolio({
    refetchInterval: 1000 * 60,
  })
  const { data: portfolioChart } = usePortfolioChart(range)

  const symbols = useMemo(
    () => [...new Set((portfolio?.holdings ?? []).map((holding) => holding.symbol))].sort(),
    [portfolio?.holdings],
  )

  usePortfolioLive(symbols)

  const cash = portfolio?.cash ?? 0
  const totalValue = portfolio?.totalValue ?? 0
  const todayChange = portfolio?.todayChange ?? 0
  const todayChangePercent = portfolio?.todayChangePercent ?? 0
  const totalProfitLoss = totalValue - INITIAL_PORTFOLIO_VALUE
  const firstPoint = portfolioChart?.points[0]?.price
  const lastPoint = portfolioChart?.points.at(-1)?.price
  const hasRangePerformance =
    typeof firstPoint === 'number' &&
    typeof lastPoint === 'number' &&
    firstPoint > 0 &&
    lastPoint > 0

  const rangeChange = hasRangePerformance ? lastPoint - firstPoint : todayChange
  const rangeChangePercent = hasRangePerformance
    ? ((lastPoint - firstPoint) / firstPoint) * 100
    : todayChangePercent
  const rangeLabel = getRangeLabel(range)

  return {
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
    todayChange,
    todayChangePercent,
    totalProfitLoss,
  }
}

function getRangeLabel(range: ChartRange) {
  switch (range) {
    case 'intraday':
      return 'Today'
    case '1M':
      return '1 Month'
    case '6M':
      return '6 Months'
    case '1Y':
      return '1 Year'
    case '3Y':
      return '3 Years'
    case 'ALL':
      return 'All Time'
  }
}

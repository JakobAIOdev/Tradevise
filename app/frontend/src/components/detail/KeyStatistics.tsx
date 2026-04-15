import StatisticContainer from './StatisticContainer'
import { LoaderCircle } from 'lucide-react'
import type { Statistic, StockStatistics } from '../../Types'

type KeyStatisticsProps = {
  statistics?: StockStatistics
  isLoading?: boolean
}

function formatPrice(value: number | null | undefined) {
  if (typeof value !== 'number') return '-'
  return value.toFixed(2)
}

function formatVolume(value: number | null | undefined) {
  if (typeof value !== 'number') return '-'

  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(value)
}

function buildStatistics(statistics?: StockStatistics): Statistic[] {
  return [
    { label: 'Previous Close', value: formatPrice(statistics?.previousClose), suffix: '€' },
    { label: 'Day High', value: formatPrice(statistics?.dayHigh), suffix: '€' },
    { label: 'Day Low', value: formatPrice(statistics?.dayLow), suffix: '€' },
    { label: '52W High', value: formatPrice(statistics?.fiftyTwoWeekHigh), suffix: '€' },
    { label: '52W Low', value: formatPrice(statistics?.fiftyTwoWeekLow), suffix: '€' },
    { label: 'Volume', value: formatVolume(statistics?.volume) },
    { label: 'Exchange', value: statistics?.exchange ?? '-' },
    { label: 'Currency', value: statistics?.currency ?? '-' },
  ]
}

export default function KeyStatistics({ statistics, isLoading = false }: KeyStatisticsProps) {
  const stats = buildStatistics(statistics)

  return (
    <div className="w-full bg-surface border border-border rounded-xl px-5 pt-5 pb-9">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-text text-body font-bold">Key Statistics</p>
        {isLoading && (
          <LoaderCircle
            size={16}
            strokeWidth={1.5}
            className="animate-spin text-muted [animation-duration:900ms] motion-reduce:animate-none"
          />
        )}
      </div>
      <ul className="flex flex-col">
        {stats.map((stat) => (
          <StatisticContainer key={stat.label} {...stat} />
        ))}
      </ul>
    </div>
  )
}

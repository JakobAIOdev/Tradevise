import StatisticContainer from './StatisticContainer'
import { LoaderCircle } from 'lucide-react'
import type { Statistic, StockStatistics } from '../../Types'
import { formatMoney } from '../../utils/format'

type KeyStatisticsProps = {
  statistics?: StockStatistics
  isLoading?: boolean
}

function formatStatisticMoney(value: number | null | undefined, currency: string | null | undefined) {
  if (typeof value !== 'number') return '-'
  return formatMoney(value, currency ?? 'EUR')
}

function formatTextValue(value: string | null | undefined) {
  return value?.trim() || '-'
}

function buildStatistics(statistics?: StockStatistics): Statistic[] {
  const currency = statistics?.currency

  return [
    { label: 'Previous Close', value: formatStatisticMoney(statistics?.previousClose, currency) },
    { label: 'Day High', value: formatStatisticMoney(statistics?.dayHigh, currency) },
    { label: 'Day Low', value: formatStatisticMoney(statistics?.dayLow, currency) },
    { label: '52W High', value: formatStatisticMoney(statistics?.fiftyTwoWeekHigh, currency) },
    { label: '52W Low', value: formatStatisticMoney(statistics?.fiftyTwoWeekLow, currency) },
    { label: 'Exchange', value: formatTextValue(statistics?.exchange) },
  ]
}

export default function KeyStatistics({ statistics, isLoading = false }: KeyStatisticsProps) {
  const stats = buildStatistics(statistics)

  return (
    <div className="flex h-95 w-full flex-col rounded-xl border border-border bg-surface px-5 pt-5 pb-6">
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
      <ul className="grid flex-1 grid-cols-2 content-between gap-x-5 gap-y-3">
        {stats.map((stat) => (
          <StatisticContainer key={stat.label} {...stat} fullWidth={stat.label === 'Exchange'} />
        ))}
      </ul>
    </div>
  )
}

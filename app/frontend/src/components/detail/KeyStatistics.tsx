import StatisticContainer from './StatisticContainer'
import { LoaderCircle } from 'lucide-react'
import type { Statistic, StockStatistics } from '../../types'
import { formatMoney } from '../../utils/format'
import { financialTermDescriptions } from '../../utils/financial-terms'
import Card, { CardTitle } from '../Card'

type KeyStatisticsProps = {
  statistics?: StockStatistics
  isLoading?: boolean
}

type StatisticWithTooltip = Statistic & {
  tooltip?: string
}

function formatStatisticMoney(
  value: number | null | undefined,
  currency: string | null | undefined,
) {
  if (typeof value !== 'number') return '-'
  return formatMoney(value, currency ?? 'EUR')
}

function formatTextValue(value: string | null | undefined) {
  return value?.trim() || '-'
}

function buildStatistics(statistics?: StockStatistics): StatisticWithTooltip[] {
  const currency = statistics?.currency

  return [
    {
      label: 'Previous Close',
      value: formatStatisticMoney(statistics?.previousClose, currency),
      tooltip: financialTermDescriptions.previousClose,
    },
    {
      label: 'Day High',
      value: formatStatisticMoney(statistics?.dayHigh, currency),
      tooltip: financialTermDescriptions.dayHigh,
    },
    {
      label: 'Day Low',
      value: formatStatisticMoney(statistics?.dayLow, currency),
      tooltip: financialTermDescriptions.dayLow,
    },
    {
      label: '52W High',
      value: formatStatisticMoney(statistics?.fiftyTwoWeekHigh, currency),
      tooltip: financialTermDescriptions.fiftyTwoWeekHigh,
    },
    {
      label: '52W Low',
      value: formatStatisticMoney(statistics?.fiftyTwoWeekLow, currency),
      tooltip: financialTermDescriptions.fiftyTwoWeekLow,
    },
    {
      label: 'Exchange',
      value: formatTextValue(statistics?.exchange),
      tooltip: financialTermDescriptions.exchange,
    },
  ]
}

export default function KeyStatistics({ statistics, isLoading = false }: KeyStatisticsProps) {
  const stats = buildStatistics(statistics)

  return (
    <Card
      className="flex min-h-95 w-full flex-1 flex-col px-5 pt-5 pb-6"
      padding="none"
      titleSpacing="sm"
      title={
        <CardTitle
          trailing={
            isLoading && (
              <LoaderCircle
                size={16}
                strokeWidth={1.5}
                className="animate-spin text-muted [animation-duration:900ms] motion-reduce:animate-none"
              />
            )
          }
        >
          Key Statistics
        </CardTitle>
      }
    >
      <dl className="grid flex-1 grid-cols-2 content-between gap-x-5 gap-y-3">
        {stats.map((stat) => (
          <StatisticContainer key={stat.label} {...stat} fullWidth={stat.label === 'Exchange'} />
        ))}
      </dl>
    </Card>
  )
}

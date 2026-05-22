import { type TooltipContentProps } from 'recharts'
import { formatPrice } from '../../utils/chart-helper'
import type { ChartHistorySource } from '../../types/chart'

type CustomTooltipProps = TooltipContentProps & {
  source: ChartHistorySource
}

const CHART_TIME_ZONE = 'Europe/Berlin'

export function CustomTooltip({ active, payload, source }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  const item = payload[0]
  const value = typeof item.value === 'number' ? item.value : Number(item.value)

  const formatOptions: Intl.DateTimeFormatOptions =
    source === 'intraday'
      ? {
          day: 'numeric',
          month: 'short',
          hour: 'numeric',
          minute: '2-digit',
          timeZone: CHART_TIME_ZONE,
        }
      : {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          timeZone: CHART_TIME_ZONE,
        }

  const formattedDate = new Intl.DateTimeFormat('de-AT', formatOptions).format(
    item.payload.time * 1000,
  )

  return (
    <div className="bg-surface px-3 py-2 border border-border rounded-xl">
      <p>{formatPrice(value)}</p>
      <p className="text-muted">{formattedDate}</p>
    </div>
  )
}

import { type TooltipContentProps } from 'recharts'
import { formatDate, formatPrice } from '../../utils/chart-helper'
import type { ChartRange } from '../../hooks/useStockChart'

type CustomTooltipProps = TooltipContentProps & {
  range: ChartRange
}

export function CustomTooltip({ active, payload, range }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  const item = payload[0]
  const value = typeof item.value === 'number' ? item.value : Number(item.value)

  return (
    <div className="bg-surface px-3 py-2 border border-border rounded-xl">
      <p>{formatPrice(value)}</p>
      <p className="text-muted">{formatDate(item.payload.time, range)}</p>
    </div>
  )
}

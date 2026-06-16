import type { ReactNode } from 'react'
import InfoTooltip from '../InfoTooltip'

type HoldingMetricProps = {
  label: string
  value: string
  subValue?: string
  tone?: string
  align?: 'left' | 'right'
  tooltip?: string
}

export default function HoldingMetric({
  label,
  value,
  subValue,
  tone = 'text-text',
  align = 'left',
  tooltip,
}: HoldingMetricProps) {
  const alignment = align === 'right' ? 'text-right' : 'text-left'
  const justify = align === 'right' ? 'justify-end' : 'justify-start'
  const labelContent: ReactNode = tooltip ? (
    <span className={`inline-flex items-center gap-1.5 ${justify}`}>
      <span>{label}</span>
      <InfoTooltip text={tooltip} align={align} />
    </span>
  ) : (
    label
  )

  return (
    <div className={alignment}>
      <div className="text-small text-muted">{labelContent}</div>
      <div className={`text-body tabular-nums ${tone}`}>{value}</div>
      {subValue ? <div className={`text-small tabular-nums ${tone}`}>{subValue}</div> : null}
    </div>
  )
}

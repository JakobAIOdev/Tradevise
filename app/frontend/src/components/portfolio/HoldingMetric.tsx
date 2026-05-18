type HoldingMetricProps = {
  label: string
  value: string
  subValue?: string
  tone?: string
  align?: 'left' | 'right'
}

export default function HoldingMetric({
  label,
  value,
  subValue,
  tone = 'text-text',
  align = 'left',
}: HoldingMetricProps) {
  const alignment = align === 'right' ? 'text-right' : 'text-left'

  return (
    <div className={alignment}>
      <div className="text-small text-muted">{label}</div>
      <div className={`text-body tabular-nums ${tone}`}>{value}</div>
      {subValue ? <div className={`text-small tabular-nums ${tone}`}>{subValue}</div> : null}
    </div>
  )
}

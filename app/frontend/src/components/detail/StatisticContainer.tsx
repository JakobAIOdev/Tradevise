import type { Statistic } from '../../types'
import InfoTooltip from '../InfoTooltip'

type StatisticContainerProps = Statistic & {
  fullWidth?: boolean
  tooltip?: string
}

export default function StatisticContainer({
  label,
  value,
  suffix,
  fullWidth = false,
  tooltip,
}: StatisticContainerProps) {
  return (
    <div
      className={`flex min-h-15 flex-col justify-between gap-1 border-b border-border/60 pb-2 last:border-b-0 ${
        fullWidth ? 'col-span-2' : ''
      }`}
    >
      <dt className="text-muted text-small inline-flex items-center gap-1.5 leading-tight">
        <span>{label}</span>
        {tooltip ? <InfoTooltip text={tooltip} /> : null}
      </dt>
      <dd className="text-text text-body tabular-nums leading-tight">
        {value}
        {suffix ? ` ${suffix}` : ''}
      </dd>
    </div>
  )
}

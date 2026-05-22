import type { Statistic } from '../../types'

type StatisticContainerProps = Statistic & {
  fullWidth?: boolean
}

export default function StatisticContainer({
  label,
  value,
  suffix,
  fullWidth = false,
}: StatisticContainerProps) {
  return (
    <div
      className={`flex min-h-15 flex-col justify-between gap-1 border-b border-border/60 pb-2 last:border-b-0 ${
        fullWidth ? 'col-span-2' : ''
      }`}
    >
      <dt className="text-muted text-small leading-tight">{label}</dt>
      <dd className="text-text text-body tabular-nums leading-tight">
        {value}
        {suffix ? ` ${suffix}` : ''}
      </dd>
    </div>
  )
}

import type { Statistic } from '../../Types'

export default function StatisticContainer({ label, value, suffix }: Statistic) {
  return (
    <li className="flex justify-between items-center py-1 ">
      <span className="text-muted text-small">{label}</span>
      <span className="text-text text-body tabular-nums">
        {value}
        {suffix ? ` ${suffix}` : ''}
      </span>
    </li>
  )
}

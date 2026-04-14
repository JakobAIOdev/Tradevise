import StatisticContainer from './StatisticContainer'
import type { Statistic } from '../../Types'

const STATISTICS: Statistic[] = [
  { label: 'Open', value: 221.63, suffix: '€' },
  { label: 'Previous Close', value: 221.63, suffix: '€' },
  { label: 'Day High', value: 223.54, suffix: '€' },
  { label: 'Day Low', value: 220.84, suffix: '€' },
  { label: '52W High', value: 220.84, suffix: '€' },
  { label: '52W Low', value: 220.84, suffix: '€' },
  { label: 'Volume', value: '27.98M' },
  { label: 'Market Cap', value: 0 },
]

export default function KeyStatistics() {
  return (
    <div className="w-full bg-surface border border-border rounded-xl px-5 pt-5 pb-9">
      <p className="text-text text-body font-bold mb-4">Key Statistics</p>
      <ul className="flex flex-col">
        {STATISTICS.map((stat) => (
          <StatisticContainer key={stat.label} {...stat} />
        ))}
      </ul>
    </div>
  )
}

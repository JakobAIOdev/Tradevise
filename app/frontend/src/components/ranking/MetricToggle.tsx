import type { LeaderboardMetric } from '../../types'
import Button from '../Button'

type MetricToggleProps = {
  metric: LeaderboardMetric
  onMetricChange: (metric: LeaderboardMetric) => void
}

export default function MetricToggle({ metric, onMetricChange }: MetricToggleProps) {
  return (
    <div className="mx-auto grid w-full max-w-222 grid-cols-2 gap-1.5 rounded-[20px] bg-surface-hover p-1.5">
      <Button
        variant={metric === 'total' ? 'surface' : 'ghost'}
        size="none"
        onClick={() => onMetricChange('total')}
        className={`rounded-[14px] py-3 text-sm text-body ${
          metric === 'total' ? 'font-bold' : 'font-normal text-muted hover:bg-surface/60'
        }`}
      >
        Total Value
      </Button>
      <Button
        variant={metric === 'seasonal' ? 'surface' : 'ghost'}
        size="none"
        onClick={() => onMetricChange('seasonal')}
        className={`rounded-[14px] py-3 text-sm text-body ${
          metric === 'seasonal' ? 'font-bold' : 'font-normal text-muted hover:bg-surface/60'
        }`}
      >
        Season (% Gain)
      </Button>
    </div>
  )
}

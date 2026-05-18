import type { LeaderboardMetric } from '../../types'

type MetricToggleProps = {
  metric: LeaderboardMetric
  onMetricChange: (metric: LeaderboardMetric) => void
}

export default function MetricToggle({ metric, onMetricChange }: MetricToggleProps) {
  return (
    <div className="mx-auto grid w-full max-w-222 grid-cols-2 gap-1.5 rounded-[20px] bg-surface-hover p-1.5">
      <button
        type="button"
        onClick={() => onMetricChange('total')}
        className={`flex cursor-pointer items-center justify-center rounded-[14px] py-3 text-sm text-body transition-colors ${
          metric === 'total' ? 'bg-surface font-bold text-text' : 'text-muted hover:bg-surface/60'
        }`}
      >
        Total Value
      </button>
      <button
        type="button"
        onClick={() => onMetricChange('seasonal')}
        className={`flex cursor-pointer items-center justify-center rounded-[14px] py-3 text-sm text-body transition-colors ${
          metric === 'seasonal'
            ? 'bg-surface font-bold text-text'
            : 'text-muted hover:bg-surface/60'
        }`}
      >
        Season (% Gain)
      </button>
    </div>
  )
}

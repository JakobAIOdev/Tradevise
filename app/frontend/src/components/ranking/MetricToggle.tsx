import type { LeaderboardMetric } from '../../types'
import SegmentedControl from '../SegmentedControl'

type MetricToggleProps = {
  metric: LeaderboardMetric
  onMetricChange: (metric: LeaderboardMetric) => void
}

const METRIC_OPTIONS: Array<{ value: LeaderboardMetric; label: string }> = [
  { value: 'total', label: 'Total Value' },
  { value: 'seasonal', label: 'Season (% Gain)' },
]

export default function MetricToggle({ metric, onMetricChange }: MetricToggleProps) {
  return (
    <SegmentedControl
      value={metric}
      options={METRIC_OPTIONS}
      onChange={(value) => onMetricChange(value as LeaderboardMetric)}
      className="mx-auto w-full max-w-222"
      optionClassName="text-sm"
    />
  )
}

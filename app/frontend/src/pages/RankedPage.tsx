import { useState } from 'react'
import PageTitle from '../components/PageTitle'
import LeaderboardPodium from '../components/ranking/LeaderboardPodium'
import LeaderboardTable from '../components/ranking/LeaderboardTable'
import MetricToggle from '../components/ranking/MetricToggle'
import { useLeaderboard } from '../hooks/useLeaderboard'
import type { LeaderboardMetric } from '../types'

export default function RankedPage() {
  const [metric, setMetric] = useState<LeaderboardMetric>('total')
  const { data, isError, isLoading } = useLeaderboard(metric)
  const entries = data?.entries ?? []

  return (
    <div className="flex flex-col gap-25">
      <PageTitle title="Leaderboard" />
      <MetricToggle metric={metric} onMetricChange={setMetric} />

      <section className="flex flex-col items-center gap-40">
        <LeaderboardPodium entries={entries} isLoading={isLoading} metric={metric} />
        <LeaderboardTable
          entries={entries}
          isError={isError}
          isLoading={isLoading}
          metric={metric}
        />
      </section>
    </div>
  )
}

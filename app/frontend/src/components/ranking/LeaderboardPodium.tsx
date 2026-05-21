import type { LeaderboardEntry, LeaderboardMetric } from '../../types'
import PodiumSlot from './PodiumSlot'

const PODIUM_ORDER = [1, 0, 2]

type LeaderboardPodiumProps = {
  entries: LeaderboardEntry[]
  isLoading: boolean
  metric: LeaderboardMetric
}

export default function LeaderboardPodium({ entries, isLoading, metric }: LeaderboardPodiumProps) {
  const podiumEntries = PODIUM_ORDER.map((index) => entries[index])

  return (
    <div className="flex h-82.5 w-full max-w-110 items-end justify-center gap-6 sm:gap-10">
      {isLoading ? (
        <div className="h-72 w-full rounded-2xl bg-surface-hover" />
      ) : (
        podiumEntries.map((entry, index) => (
          <PodiumSlot key={entry?.portfolioId ?? `empty-${index}`} entry={entry} metric={metric} />
        ))
      )}
    </div>
  )
}

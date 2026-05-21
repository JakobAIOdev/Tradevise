import type { LeaderboardEntry, LeaderboardMetric } from '../../types'
import LeaderboardRow from './LeaderboardRow'
import LeaderboardTableState, { LeaderboardTableSkeleton } from './LeaderboardTableState'

type LeaderboardTableProps = {
  entries: LeaderboardEntry[]
  isError: boolean
  isLoading: boolean
  metric: LeaderboardMetric
}

export default function LeaderboardTable({
  entries,
  isError,
  isLoading,
  metric,
}: LeaderboardTableProps) {
  const tableEntries = entries.slice(3)

  return (
    <div className="w-full max-w-281 overflow-hidden rounded-[18px] border border-border bg-surface shadow-sm">
      {isError && <LeaderboardTableState variant="error" />}

      {!isError && isLoading && <LeaderboardTableSkeleton />}

      {!isError && !isLoading && entries.length === 0 && (
        <LeaderboardTableState>No portfolios yet.</LeaderboardTableState>
      )}

      {!isError && !isLoading && tableEntries.length === 0 && entries.length > 0 && (
        <LeaderboardTableState>Top three portfolios are on the podium.</LeaderboardTableState>
      )}

      {!isError &&
        !isLoading &&
        tableEntries.map((entry) => (
          <LeaderboardRow key={entry.portfolioId} entry={entry} metric={metric} />
        ))}
    </div>
  )
}

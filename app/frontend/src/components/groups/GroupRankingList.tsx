import type { LeaderboardEntry } from '../../types'
import { formatSignedPercent } from '../../utils/format'
import { getSeasonGainTextClass } from '../../utils/initials'
import LeaderboardUser from '../LeaderboardUser'

type GroupRankingListProps = {
  entries: LeaderboardEntry[]
  isError: boolean
  isLoading: boolean
}

export default function GroupRankingList({ entries, isError, isLoading }: GroupRankingListProps) {
  return (
    <div className="mt-40">
      <h2 className="text-h3-mobile font-bold leading-tight text-text">Group Ranking</h2>

      <div className={`mt-5 ${entries.length > 5 ? 'max-h-97.5 overflow-y-auto' : ''}`}>
        {isLoading && <p className="py-6 text-body-mobile text-muted">Loading ranking...</p>}
        {isError && <p className="py-6 text-body-mobile text-muted">Could not load ranking.</p>}

        {!isLoading && !isError && entries.length === 0 && (
          <p className="py-6 text-body-mobile text-muted">No portfolios yet.</p>
        )}

        {!isLoading &&
          !isError &&
          entries.map((entry) => <GroupRankingRow key={entry.userId} entry={entry} />)}
      </div>
    </div>
  )
}

function GroupRankingRow({ entry }: { entry: LeaderboardEntry }) {
  return (
    <div
      className={`grid min-h-19.5 grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 px-3 ${
        entry.isCurrentUser
          ? 'border-b border-border bg-surface-hover/70'
          : 'border-b border-border last:border-b-0'
      }`}
    >
      <p className="text-body-mobile font-bold text-muted">{entry.rank}</p>
      <LeaderboardUser username={entry.username} isCurrentUser={entry.isCurrentUser} />
      <p
        className={`shrink-0 text-body-mobile font-medium ${getSeasonGainTextClass(
          entry.seasonGainPercent,
        )}`}
      >
        {entry.seasonGainPercent === null ? 'n/a' : formatSignedPercent(entry.seasonGainPercent)}
      </p>
    </div>
  )
}

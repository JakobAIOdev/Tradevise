import type { LeaderboardEntry, LeaderboardMetric } from '../../types'
import { formatSignedPercent } from '../../utils/format'
import { getLeaderboardDisplayValue, getSeasonGainTextClass } from '../../utils/initials'
import LeaderboardUser from '../LeaderboardUser'

type LeaderboardRowProps = {
  entry: LeaderboardEntry
  metric: LeaderboardMetric
}

export default function LeaderboardRow({ entry, metric }: LeaderboardRowProps) {
  const primaryValue = getLeaderboardDisplayValue(entry, metric)
  const seasonValue =
    entry.seasonGainPercent === null ? null : formatSignedPercent(entry.seasonGainPercent)
  const seasonTrendClass = getSeasonGainTextClass(entry.seasonGainPercent)

  return (
    <div
      className={`grid min-h-20.5 grid-cols-[40px_minmax(0,1fr)_minmax(90px,max-content)] items-center gap-3 border-b border-border px-4 last:border-b-0 md:grid-cols-[56px_minmax(0,1fr)_minmax(110px,max-content)] md:gap-4 md:px-7 ${
        entry.isCurrentUser ? 'bg-surface-hover/70' : 'bg-surface'
      }`}
    >
      <p className="truncate text-center text-body text-muted" title={`Rank ${entry.rank}`}>
        {entry.rank}
      </p>
      <LeaderboardUser username={entry.username} isCurrentUser={entry.isCurrentUser} />
      <div className="min-w-0 text-right">
        <p
          className={`truncate text-body leading-tight ${
            metric === 'seasonal' ? getSeasonGainTextClass(entry.seasonGainPercent) : 'text-text'
          }`}
          title={primaryValue}
        >
          {primaryValue}
        </p>
        {metric === 'total' && seasonValue !== null && (
          <p
            className={`truncate text-[13px] leading-tight ${seasonTrendClass}`}
            title={seasonValue}
          >
            {seasonValue}
          </p>
        )}
      </div>
    </div>
  )
}

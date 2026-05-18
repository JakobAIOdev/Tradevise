import type { LeaderboardEntry, LeaderboardMetric } from '../../types'
import { formatSignedPercent } from '../../utils/format'
import {
  getInitials,
  getLeaderboardDisplayValue,
  getSeasonGainTextClass,
} from '../../utils/initials'

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
      className={`grid min-h-20.5 grid-cols-[40px_44px_minmax(0,1fr)_minmax(90px,max-content)] items-center gap-3 border-b border-border px-4 last:border-b-0 md:grid-cols-[56px_44px_minmax(0,1fr)_minmax(110px,max-content)] md:gap-4 md:px-7 ${
        entry.isCurrentUser ? 'bg-surface-hover/70' : 'bg-surface'
      }`}
    >
      <p className="truncate text-center text-body text-muted" title={`Rank ${entry.rank}`}>
        {entry.rank}
      </p>
      <div className="flex size-11 items-center justify-center rounded-full bg-surface-hover text-small font-bold text-text">
        {getInitials(entry.username)}
      </div>
      <div className="flex min-w-0 items-center gap-2 overflow-hidden">
        <p className="min-w-0 truncate text-body text-text" title={entry.username}>
          {entry.username}
        </p>
        {entry.isCurrentUser && (
          <span className="shrink-0 rounded-md bg-text px-2 py-1 text-[0.65rem] font-bold leading-none text-surface">
            YOU
          </span>
        )}
      </div>
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

import { Medal, Trophy } from 'lucide-react'
import type { LeaderboardEntry, LeaderboardMetric } from '../../types'
import {
  getInitials,
  getLeaderboardDisplayValue,
  getSeasonGainTextClass,
} from '../../utils/initials'

type PodiumSlotProps = {
  entry?: LeaderboardEntry
  metric: LeaderboardMetric
}

export default function PodiumSlot({ entry, metric }: PodiumSlotProps) {
  if (!entry) {
    return <div className="hidden w-30 shrink-0 md:block" />
  }

  const isWinner = entry.rank === 1
  const heightClass = entry.rank === 1 ? 'h-[132px]' : 'h-[103px]'
  const displayValue = getLeaderboardDisplayValue(entry, metric)

  return (
    <div className="flex w-30 shrink-0 flex-col items-center justify-end gap-8">
      <div
        className={`flex size-19.5 items-center justify-center rounded-full text-body font-bold ${
          isWinner ? 'bg-text text-surface' : 'bg-surface-hover text-muted'
        }`}
      >
        {getInitials(entry.username)}
      </div>

      <div className="w-full min-w-0 text-center">
        <p className="truncate text-body leading-tight text-text" title={entry.username}>
          {entry.username}
        </p>
        <p
          className={`text-small leading-tight ${
            metric === 'seasonal' ? getSeasonGainTextClass(entry.seasonGainPercent) : 'text-muted'
          }`}
          title={displayValue}
        >
          {displayValue}
        </p>
      </div>

      <div
        className={`flex w-24.5 items-center justify-center rounded-t-2xl border border-border ${
          isWinner ? 'bg-text text-surface' : 'bg-surface-hover text-muted'
        } ${heightClass}`}
      >
        {isWinner ? <Trophy size={34} strokeWidth={1.7} /> : <Medal size={30} strokeWidth={1.7} />}
      </div>
    </div>
  )
}

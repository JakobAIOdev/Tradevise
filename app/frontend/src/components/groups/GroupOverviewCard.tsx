import { Trophy, Users } from 'lucide-react'
import { useGroupLeaderboard } from '../../hooks/useGroups'
import type { GroupSummary } from '../../types'
import { formatSignedPercent } from '../../utils/format'
import { getSeasonGainTextClass } from '../../utils/initials'

type GroupOverviewCardProps = {
  group: GroupSummary
  onOpen: (groupId: string) => void
}

export default function GroupOverviewCard({ group, onOpen }: GroupOverviewCardProps) {
  const { data } = useGroupLeaderboard(group.id, 'seasonal')
  const entries = data?.entries ?? []
  const topEntry = entries[0]
  const currentUserEntry = entries.find((entry) => entry.isCurrentUser)
  const currentRank = currentUserEntry?.rank
  const currentGain = currentUserEntry?.seasonGainPercent

  return (
    <button
      type="button"
      onClick={() => onOpen(group.id)}
      className="w-full rounded-xl border border-border bg-surface px-25 py-25 text-left shadow-sm transition-colors hover:bg-surface-hover"
    >
      <div className="flex items-start justify-between gap-18">
        <div className="flex min-w-0 items-center gap-12">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface-hover text-text">
            <Users size={17} strokeWidth={1.7} />
          </div>

          <div className="min-w-0">
            <h2 className="truncate text-body font-bold text-text">{group.name}</h2>
            <p className="text-small text-muted">{group._count.members} members</p>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-small text-muted">Your Rank</p>
          <p className="text-body font-bold text-text">{currentRank ? `#${currentRank}` : '-'}</p>
        </div>
      </div>

      <div className="mt-18 flex items-center justify-between gap-16 border-t border-border pt-5">
        <div className="flex min-w-0 items-center gap-5 text-muted">
          <Trophy size={14} strokeWidth={1.5} />
          <p className="truncate text-body">Top: {topEntry?.username ?? '-'}</p>
        </div>

        <p className={`shrink-0 text-body ${getSeasonGainTextClass(currentGain ?? null)}`}>
          {typeof currentGain === 'number' ? formatSignedPercent(currentGain) : '-'}
        </p>
      </div>
    </button>
  )
}

export function GroupCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-surface px-25 py-25 shadow-sm">
      <div className="flex items-start justify-between gap-18">
        <div className="flex items-center gap-12">
          <div className="size-9 rounded-xl bg-surface-hover" />
          <div>
            <div className="h-4 w-32 rounded bg-surface-hover" />
            <div className="mt-2 h-3 w-20 rounded bg-surface-hover" />
          </div>
        </div>
        <div className="h-8 w-14 rounded bg-surface-hover" />
      </div>
      <div className="mt-18 border-t border-border pt-14">
        <div className="h-4 w-36 rounded bg-surface-hover" />
      </div>
    </div>
  )
}

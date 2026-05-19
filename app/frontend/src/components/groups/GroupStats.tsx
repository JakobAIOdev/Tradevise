import { formatSignedPercent } from '../../utils/format'
import { getSeasonGainTextClass } from '../../utils/initials'

type GroupStatsProps = {
  memberCount?: number
  currentRank?: number
  topGain?: number | null
}

export default function GroupStats({ memberCount, currentRank, topGain }: GroupStatsProps) {
  return (
    <div className="mt-10 grid grid-cols-3 gap-5">
      <GroupStat value={memberCount ?? '-'} label="Members" />
      <GroupStat value={currentRank ? `#${currentRank}` : '-'} label="Your Rank" />
      <GroupStat
        value={typeof topGain === 'number' ? formatSignedPercent(topGain) : '-'}
        label="Top Gain"
        trend={topGain}
      />
    </div>
  )
}

function GroupStat({
  value,
  label,
  trend = null,
}: {
  value: string | number
  label: string
  trend?: number | null
}) {
  const valueClass = typeof trend === 'number' ? getSeasonGainTextClass(trend) : 'text-text'

  return (
    <div className="rounded-2xl bg-surface-hover px-3 py-5 text-center">
      <p className={`text-[22px] font-bold leading-none ${valueClass}`}>{value}</p>
      <p className="mt-2 text-[0.95rem] leading-none text-muted">{label}</p>
    </div>
  )
}

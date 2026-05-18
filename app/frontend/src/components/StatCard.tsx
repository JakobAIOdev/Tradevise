import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string
  valueTrend?: 'positive' | 'negative' | 'neutral'
  sub: string
  subTrend?: 'positive' | 'negative' | 'neutral'
}

const trendColor = (trend?: 'positive' | 'negative' | 'neutral', muted = false) =>
  trend === 'positive'
    ? 'text-bullish'
    : trend === 'negative'
      ? 'text-bearish'
      : muted
        ? 'text-muted'
        : 'text-text'

export default function StatCard({
  icon: Icon,
  label,
  value,
  valueTrend,
  sub,
  subTrend,
}: StatCardProps) {
  return (
    <div className="flex h-full min-h-40 flex-col gap-10 rounded-xl border border-border bg-surface p-25">
      <div className="flex items-center gap-8 text-muted">
        <Icon size={20} strokeWidth={1.5} />
        <span className="text-small">{label}</span>
      </div>

      <p className={`text-h2 ${trendColor(valueTrend)}`}>{value}</p>

      <p className={`text-small ${trendColor(subTrend, true)}`}>{sub}</p>
    </div>
  )
}

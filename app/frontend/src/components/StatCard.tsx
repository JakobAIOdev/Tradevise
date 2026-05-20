import type { LucideIcon } from 'lucide-react'
import Card, { CardTitle } from './Card'

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
    <Card className="flex h-full min-h-40 flex-col gap-10">
      <CardTitle
        leading={<Icon size={20} strokeWidth={1.5} />}
        className="text-muted"
        titleClassName="text-small font-normal text-muted"
      >
        {label}
      </CardTitle>
      <p className={`text-h2 ${trendColor(valueTrend)}`}>{value}</p>
      <p className={`text-small ${trendColor(subTrend, true)}`}>{sub}</p>
    </Card>
  )
}

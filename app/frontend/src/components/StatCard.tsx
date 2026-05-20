import type { LucideIcon } from 'lucide-react'
import type { Trend } from '../utils/trend'
import { getTrendTextClass } from '../utils/trend'
import Card, { CardTitle } from './Card'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string
  valueTrend?: Trend
  sub: string
  subTrend?: Trend
}

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
      <p className={`text-h2 ${getTrendTextClass(valueTrend)}`}>{value}</p>
      <p className={`text-small ${getTrendTextClass(subTrend, 'text-muted')}`}>{sub}</p>
    </Card>
  )
}

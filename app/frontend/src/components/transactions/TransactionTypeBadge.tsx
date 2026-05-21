import type { TradeType } from '../../types'

const typeStyle: Record<TradeType, string> = {
  BUY: 'bg-bullish/10 text-bullish',
  SELL: 'bg-bearish/10 text-bearish',
}

export default function TransactionTypeBadge({ type }: { type: TradeType }) {
  return (
    <span
      className={`inline-flex items-center gap-4 rounded-lg px-10 py-1 text-small font-bold ${typeStyle[type]}`}
    >
      {type}
    </span>
  )
}

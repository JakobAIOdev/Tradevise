import type { Stock } from '../../Types'
import { ChevronUp, ChevronDown } from 'lucide-react'
import StockLogo from '../StockLogo'
import { Link } from 'react-router-dom'

export default function StockCard({ name, ticker, change, logo }: Stock) {
  const positive = change >= 0

  return (
    <Link to={`/detail/${ticker}`}>
      <div className="flex items-center gap-15 bg-surface border border-border rounded-xl p-15 cursor-pointer hover:bg-surface-hover transition-colors">
        <StockLogo src={logo} ticker={ticker} />
        <div className="flex-1 min-w-0">
          <p className="text-body text-text truncate">{name}</p>
          <p className="text-small text-muted">{ticker}</p>
        </div>
        <span
          className={`flex items-center gap-1 text-body font-medium shrink-0 ${positive ? 'text-bullish' : 'text-bearish'}`}
        >
          {positive ? (
            <ChevronUp size={20} strokeWidth={1.75} />
          ) : (
            <ChevronDown size={20} strokeWidth={1.75} />
          )}
          {Math.abs(change).toFixed(2)}%
        </span>
      </div>
    </Link>
  )
}

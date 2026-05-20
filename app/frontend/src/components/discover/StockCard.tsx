import type { Stock } from '../../types'
import { ChevronUp, ChevronDown } from 'lucide-react'
import StockLogo from '../StockLogo'
import { Link } from 'react-router-dom'
import Card from '../Card'
import { getSignedTrendTextClass } from '../../utils/trend'

interface StockCardProps extends Stock {
  interactive?: boolean
}

export default function StockCard(stock: StockCardProps) {
  const { name, ticker, change, logo } = stock
  const interactive = stock.interactive ?? true
  const positive = change >= 0
  const changeClass = getSignedTrendTextClass(change)
  const cardClassName = `flex items-center gap-15 transition-colors ${
    interactive ? 'cursor-pointer hover:bg-surface-hover' : 'cursor-not-allowed opacity-70'
  }`

  const content = (
    <Card className={cardClassName} padding="sm" aria-disabled={!interactive}>
      <StockLogo src={logo} ticker={ticker} />
      <div className="flex-1 min-w-0">
        <p className="text-body text-text truncate">{name}</p>
        <div className="flex items-center gap-8">
          <p className="text-small text-muted">{ticker}</p>
        </div>
      </div>
      <span className={`flex items-center gap-1 text-body font-medium shrink-0 ${changeClass}`}>
        {positive ? (
          <ChevronUp size={20} strokeWidth={1.75} />
        ) : (
          <ChevronDown size={20} strokeWidth={1.75} />
        )}
        {Math.abs(change).toFixed(2)}%
      </span>
    </Card>
  )

  if (!interactive) return content

  return (
    <Link to={`/detail/${encodeURIComponent(ticker)}`} state={{ stock }}>
      {content}
    </Link>
  )
}

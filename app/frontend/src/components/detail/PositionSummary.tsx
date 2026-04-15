import type { PortfolioHolding } from '../../Types'
import { formatMoney, formatShares } from '../../utils/format'

type PositionSummaryProps = {
  holding?: PortfolioHolding
  isLoading?: boolean
}

export default function PositionSummary({ holding, isLoading = false }: PositionSummaryProps) {
  const profitLoss = holding?.profitLoss ?? 0
  const isPositive = profitLoss >= 0
  const profitLossPercent =
    holding && holding.averagePrice > 0
      ? ((holding.currentPrice - holding.averagePrice) / holding.averagePrice) * 100
      : 0

  return (
    <div className="bg-surface h-45 border border-border rounded-xl px-25 pt-5">
      <div className="flex items-center justify-between">
        <p className="text-text text-body">Your Position</p>
        {holding && (
          <span className={isPositive ? 'text-bullish text-small' : 'text-bearish text-small'}>
            {isPositive ? '+ ' : '- '}
            {Math.abs(profitLossPercent).toFixed(2)} %
          </span>
        )}
      </div>

      {isLoading ? (
        <p className="mt-6 text-small text-muted">Loading position...</p>
      ) : holding ? (
        <div className="mt-5 grid grid-cols-2 gap-x-8 gap-y-2">
          <div>
            <p className="text-xs text-muted">Market Value</p>
            <p className="text-body text-text tabular-nums">{formatMoney(holding.marketValue)}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Shares</p>
            <p className="text-body text-text tabular-nums">{formatShares(holding.quantity)}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Avg Buy</p>
            <p className="text-body text-text tabular-nums">{formatMoney(holding.averagePrice)}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Profit/Loss</p>
            <p className={`text-body tabular-nums ${isPositive ? 'text-bullish' : 'text-bearish'}`}>
              {isPositive ? '+ ' : '- '}
              {formatMoney(Math.abs(profitLoss))}
            </p>
          </div>
        </div>
      ) : (
        <p className="mt-6 text-small text-muted">You do not own this stock yet.</p>
      )}
    </div>
  )
}

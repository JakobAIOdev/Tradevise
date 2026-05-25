import type { PortfolioHolding } from '../../types'
import { formatMoney, formatShares } from '../../utils/format'
import { getSignedTrendTextClass } from '../../utils/trend'
import Card, { CardTitle } from '../Card'

type PositionSummaryProps = {
  holding?: PortfolioHolding
  isLoading?: boolean
}

export default function PositionSummary({ holding, isLoading = false }: PositionSummaryProps) {
  const profitLoss = holding?.profitLoss ?? 0
  const isPositive = profitLoss >= 0
  const profitLossClass = getSignedTrendTextClass(profitLoss)
  const profitLossPercent =
    holding && holding.averagePrice > 0
      ? ((holding.currentPrice - holding.averagePrice) / holding.averagePrice) * 100
      : 0

  return (
    <Card
      className="h-45 px-25 pt-5"
      padding="none"
      titleSpacing="none"
      title={
        <CardTitle
          trailing={
            holding && (
              <span className={`${profitLossClass} text-small`}>
                {isPositive ? '+ ' : '- '}
                {Math.abs(profitLossPercent).toFixed(2)} %
              </span>
            )
          }
        >
          Your Position
        </CardTitle>
      }
    >
      {isLoading ? (
        <p className="mt-6 text-small text-muted">Loading position...</p>
      ) : holding ? (
        <dl className="mt-5 grid grid-cols-2 gap-x-8 gap-y-2">
          <div>
            <dt className="text-xs text-muted">Market Value</dt>
            <dd className="text-body text-text tabular-nums">{formatMoney(holding.marketValue)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Shares</dt>
            <dd className="text-body text-text tabular-nums">{formatShares(holding.quantity)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Avg Buy</dt>
            <dd className="text-body text-text tabular-nums">{formatMoney(holding.averagePrice)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Profit/Loss</dt>
            <dd className={`text-body tabular-nums ${profitLossClass}`}>
              {isPositive ? '+ ' : '- '}
              {formatMoney(Math.abs(profitLoss))}
            </dd>
          </div>
        </dl>
      ) : (
        <p className="mt-6 text-small text-muted">You do not own this stock yet.</p>
      )}
    </Card>
  )
}

import { Link } from 'react-router-dom'
import AssetIdentity from '../AssetIdentity'
import { buildHoldingLinkState } from './holdingLinkState'
import type { PortfolioTableRow } from './TableColumns'
import {
  formatMoney,
  formatShares,
  formatSignedMoney,
  formatSignedPercent,
} from '../../utils/format'
import { getSignedTrendTextClass } from '../../utils/trend'
import HoldingMetric from './HoldingMetric'

type MobileHoldingCardProps = {
  item: PortfolioTableRow
}

export default function MobileHoldingCard({ item }: MobileHoldingCardProps) {
  const todayTone = getSignedTrendTextClass(item.todayChange)
  const totalTone = getSignedTrendTextClass(item.profitLoss)

  return (
    <Link
      to={`/detail/${encodeURIComponent(item.symbol)}`}
      state={buildHoldingLinkState(item)}
      className="block p-18 transition-colors hover:bg-surface-hover"
    >
      <div className="flex items-center gap-4">
        <AssetIdentity
          symbol={item.symbol}
          name={item.displayName}
          logoUrl={item.logoUrl}
          detail={`${item.symbol} • ${formatShares(item.quantity)} shares`}
        />
      </div>
      <div className="mt-18 grid grid-cols-2 gap-x-12 gap-y-15">
        <HoldingMetric label="Price" value={formatMoney(item.currentPrice)} />
        <HoldingMetric label="Value" value={formatMoney(item.marketValue)} align="right" />
        <HoldingMetric
          label="Today"
          value={formatSignedMoney(item.todayChange)}
          subValue={
            item.todayChangePercent !== null
              ? formatSignedPercent(item.todayChangePercent)
              : undefined
          }
          tone={todayTone}
        />
        <HoldingMetric
          label="Total P/L"
          value={formatSignedMoney(item.profitLoss)}
          subValue={formatSignedPercent(item.totalPlPercent)}
          tone={totalTone}
          align="right"
        />
      </div>
    </Link>
  )
}

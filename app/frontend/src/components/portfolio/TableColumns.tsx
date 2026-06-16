import { createColumnHelper } from '@tanstack/react-table'
import { Link } from 'react-router-dom'
import AssetIdentity from '../AssetIdentity'
import {
  formatMoney,
  formatShares,
  formatSignedMoney,
  formatSignedPercent,
} from '../../utils/format'
import { getSignedTrendTextClass } from '../../utils/trend'
import { financialTermDescriptions } from '../../utils/financial-terms'
import { buildHoldingLinkState } from './holdingLinkState'
import InfoTooltip from '../InfoTooltip'

export type PortfolioTableRow = {
  id: string
  symbol: string
  quantity: number
  averagePrice: number
  currentPrice: number
  previousClose: number | null
  marketValue: number
  profitLoss: number
  todayChange: number
  displayName: string
  logoUrl: string | null
  todayChangePercent: number | null
  totalPlPercent: number
}

const columnHelper = createColumnHelper<PortfolioTableRow>()

function renderHeaderWithTooltip({
  label,
  tooltip,
  align = 'right',
}: {
  label: string
  tooltip: string
  align?: 'left' | 'right'
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span>{label}</span>
      <InfoTooltip text={tooltip} align={align} />
    </span>
  )
}

export const columns = [
  columnHelper.display({
    id: 'asset',
    header: () => <span>Assets</span>,
    cell: ({ row }) => {
      const item = row.original

      return (
        <Link
          to={`/detail/${encodeURIComponent(item.symbol)}`}
          state={buildHoldingLinkState(item)}
          className="group flex items-center gap-4"
        >
          <AssetIdentity
            symbol={item.symbol}
            name={item.displayName}
            logoUrl={item.logoUrl}
            detail={`${item.symbol} • ${formatShares(item.quantity)} shares`}
            nameClassName="text-body text-text transition-colors group-hover:text-muted"
          />
        </Link>
      )
    },
  }),

  columnHelper.accessor('currentPrice', {
    id: 'price',
    header: () => (
      renderHeaderWithTooltip({ label: 'Price', tooltip: financialTermDescriptions.price })
    ),
    cell: ({ getValue }) => (
      <div className="text-right text-body text-text">{formatMoney(getValue())}</div>
    ),
  }),

  columnHelper.accessor('marketValue', {
    id: 'value',
    header: () => (
      renderHeaderWithTooltip({ label: 'Value', tooltip: financialTermDescriptions.value })
    ),
    cell: ({ getValue }) => (
      <div className="text-right text-body text-text">{formatMoney(getValue())}</div>
    ),
  }),

  columnHelper.display({
    id: 'today',
    header: () => (
      renderHeaderWithTooltip({ label: 'Today', tooltip: financialTermDescriptions.today })
    ),
    cell: ({ row }) => {
      const item = row.original
      const tone = getSignedTrendTextClass(item.todayChange)

      return (
        <div className={`text-right ${tone}`}>
          <div className="text-body">{formatSignedMoney(item.todayChange)}</div>
          {item.todayChangePercent !== null && (
            <div className="text-small">{formatSignedPercent(item.todayChangePercent)}</div>
          )}
        </div>
      )
    },
  }),

  columnHelper.display({
    id: 'totalPl',
    header: () => (
      renderHeaderWithTooltip({
        label: 'Total P/L',
        tooltip: financialTermDescriptions.totalProfitLoss,
      })
    ),
    cell: ({ row }) => {
      const item = row.original
      const tone = getSignedTrendTextClass(item.profitLoss)

      return (
        <div className={`text-right ${tone}`}>
          <div className="text-body ">{formatSignedMoney(item.profitLoss)}</div>
          <div className="text-small">{formatSignedPercent(item.totalPlPercent)}</div>
        </div>
      )
    },
  }),
]

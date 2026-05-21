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
import { buildHoldingLinkState } from './holdingLinkState'

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
    header: () => <span>Price</span>,
    cell: ({ getValue }) => (
      <div className="text-right text-body text-text">{formatMoney(getValue())}</div>
    ),
  }),

  columnHelper.accessor('marketValue', {
    id: 'value',
    header: () => <span>Value</span>,
    cell: ({ getValue }) => (
      <div className="text-right text-body text-text">{formatMoney(getValue())}</div>
    ),
  }),

  columnHelper.display({
    id: 'today',
    header: () => <span>Today</span>,
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
    header: () => <span>Total P/L</span>,
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

import { createColumnHelper } from '@tanstack/react-table'
import { Link } from 'react-router-dom'
import StockLogo from '../StockLogo'
import {
  formatMoney,
  formatShares,
  formatSignedMoney,
  formatSignedPercent,
} from '../../utils/format'

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
          state={{
            stock: {
              name: item.displayName,
              ticker: item.symbol,
              change: item.todayChangePercent ?? 0,
              logo: item.logoUrl ?? '',
              price: item.currentPrice,
              changeValue: item.todayChange,
              positiveChange: item.todayChange >= 0,
            },
          }}
          className="group flex items-center gap-4"
        >
          <StockLogo src={item.logoUrl ?? ''} ticker={item.symbol} size={48} />
          <div className="min-w-0">
            <div className="text-body text-text truncate transition-colors group-hover:text-muted">
              {item.displayName}
            </div>
            <div className="text-small text-muted">{formatShares(item.quantity)} shares</div>
          </div>
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
      const tone = item.todayChange >= 0 ? 'text-bullish' : 'text-bearish'

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
      const tone = item.profitLoss >= 0 ? 'text-bullish' : 'text-bearish'

      return (
        <div className={`text-right ${tone}`}>
          <div className="text-body ">{formatSignedMoney(item.profitLoss)}</div>
          <div className="text-small">{formatSignedPercent(item.totalPlPercent)}</div>
        </div>
      )
    },
  }),
]

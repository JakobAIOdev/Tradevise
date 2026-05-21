import { Link } from 'react-router-dom'
import AssetIdentity from '../AssetIdentity'
import type { StockMetadata } from '../../hooks/useStockMetadata'
import type { PortfolioTransaction } from '../../types'
import { formatMoney, formatShares } from '../../utils/format'
import { formatTransactionDate } from '../../utils/transaction-format'
import { buildTransactionLinkState } from '../../utils/transaction-link-state'
import TransactionResult from './TransactionResult'
import TransactionTypeBadge from './TransactionTypeBadge'

type TransactionMobileRowProps = {
  transaction: PortfolioTransaction
  asset: StockMetadata
}

export default function TransactionMobileRow({ transaction, asset }: TransactionMobileRowProps) {
  return (
    <Link
      to={`/detail/${encodeURIComponent(transaction.symbol)}`}
      state={buildTransactionLinkState(transaction, asset)}
      className="block p-18 transition-colors hover:bg-surface-hover"
    >
      <div className="flex items-start justify-between gap-12">
        <div className="min-w-0">
          <AssetIdentity
            symbol={transaction.symbol}
            name={asset.name}
            logoUrl={asset.logoUrl}
            logoSize={40}
            nameClassName="text-body font-bold text-text"
          />
          <p className="mt-2 text-small text-muted">
            {formatTransactionDate(transaction.createdAt)}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-body font-bold text-text">{formatMoney(transaction.total)}</p>
          <p className="text-small text-muted">{formatShares(transaction.quantity)} shares</p>
        </div>
      </div>
      <div className="mt-12">
        <TransactionTypeBadge type={transaction.type} />
      </div>
      <div className="mt-12 flex items-center justify-between gap-12 text-small text-muted">
        <span>Price</span>
        <span className="font-bold text-text">{formatMoney(transaction.price)}</span>
      </div>
      <div className="mt-8 flex items-center justify-between gap-12 text-small text-muted">
        <span>Result</span>
        <TransactionResult transaction={transaction} />
      </div>
    </Link>
  )
}

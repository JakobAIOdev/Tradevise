import { Link } from 'react-router-dom'
import AssetIdentity from '../AssetIdentity'
import Card from '../Card'
import type { StockMetadata } from '../../hooks/useStockMetadata'
import type { PortfolioTransaction } from '../../types'
import { formatMoney, formatShares } from '../../utils/format'
import { buildStockLogoUrl } from '../../utils/stocks'
import { formatTransactionDate } from '../../utils/transaction-format'
import { buildTransactionLinkState } from '../../utils/transaction-link-state'
import TransactionMobileRow from './TransactionMobileRow'
import TransactionResult from './TransactionResult'
import TransactionTypeBadge from './TransactionTypeBadge'

type TransactionsTableProps = {
  transactions: PortfolioTransaction[]
  assetsBySymbol: Map<string, StockMetadata>
}

type TransactionAssetLinkProps = {
  transaction: PortfolioTransaction
  asset: StockMetadata
}

function getAssetMetadata(symbol: string, assetsBySymbol: Map<string, StockMetadata>) {
  return (
    assetsBySymbol.get(symbol) ?? {
      name: symbol,
      logoUrl: buildStockLogoUrl(symbol),
    }
  )
}

function TransactionAssetLink({ transaction, asset }: TransactionAssetLinkProps) {
  return (
    <Link
      to={`/detail/${encodeURIComponent(transaction.symbol)}`}
      state={buildTransactionLinkState(transaction, asset)}
      className="block transition-colors hover:opacity-80"
    >
      <AssetIdentity
        symbol={transaction.symbol}
        name={asset.name}
        logoUrl={asset.logoUrl}
        logoSize={40}
        nameClassName="text-body font-bold text-text"
      />
    </Link>
  )
}

export default function TransactionsTable({
  transactions,
  assetsBySymbol,
}: TransactionsTableProps) {
  return (
    <Card as="section" padding="none" className="overflow-hidden">
      {transactions.length > 0 ? (
        <>
          <div className="divide-y divide-border md:hidden">
            {transactions.map((transaction) => (
              <TransactionMobileRow
                key={transaction.id}
                transaction={transaction}
                asset={getAssetMetadata(transaction.symbol, assetsBySymbol)}
              />
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-180 border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-25 py-18 text-left text-small text-muted">Asset</th>
                  <th className="px-25 py-18 text-left text-small text-muted">Type</th>
                  <th className="px-25 py-18 text-right text-small text-muted">Shares</th>
                  <th className="px-25 py-18 text-right text-small text-muted">Price</th>
                  <th className="px-25 py-18 text-right text-small text-muted">Total</th>
                  <th className="px-25 py-18 text-right text-small text-muted">Result</th>
                  <th className="px-25 py-18 text-right text-small text-muted">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => {
                  const asset = getAssetMetadata(transaction.symbol, assetsBySymbol)

                  return (
                    <tr key={transaction.id} className="border-b border-border last:border-b-0">
                      <td className="px-25 py-18">
                        <TransactionAssetLink transaction={transaction} asset={asset} />
                      </td>
                      <td className="px-25 py-18">
                        <TransactionTypeBadge type={transaction.type} />
                      </td>
                      <td className="px-25 py-18 text-right text-text">
                        {formatShares(transaction.quantity)}
                      </td>
                      <td className="px-25 py-18 text-right text-text">
                        {formatMoney(transaction.price)}
                      </td>
                      <td className="px-25 py-18 text-right font-bold text-text">
                        {formatMoney(transaction.total)}
                      </td>
                      <td className="px-25 py-18 text-right">
                        <TransactionResult transaction={transaction} />
                      </td>
                      <td className="px-25 py-18 text-right text-muted">
                        {formatTransactionDate(transaction.createdAt)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="px-25 py-25 text-body text-muted">No transactions yet.</div>
      )}
    </Card>
  )
}

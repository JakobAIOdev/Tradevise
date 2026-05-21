import { ReceiptText } from 'lucide-react'
import Card, { CardTitle } from '../Card'
import type { PortfolioTransaction } from '../../types'
import { formatTransactionDate } from '../../utils/transaction-format'

type TransactionsSummaryProps = {
  portfolioName?: string
  transactions: PortfolioTransaction[]
  isLoading: boolean
}

export default function TransactionsSummary({
  portfolioName,
  transactions,
  isLoading,
}: TransactionsSummaryProps) {
  const buyCount = transactions.filter((transaction) => transaction.type === 'BUY').length
  const sellCount = transactions.length - buyCount

  return (
    <Card
      as="section"
      title={
        <CardTitle
          leading={<ReceiptText size={22} strokeWidth={1.8} />}
          trailing={
            <span className="text-small text-muted">
              {isLoading ? 'Loading' : `${transactions.length} total`}
            </span>
          }
        >
          {portfolioName ?? 'Portfolio'}
        </CardTitle>
      }
    >
      <div className="grid gap-15 sm:grid-cols-3">
        <div>
          <p className="text-small text-muted">Buys</p>
          <p className="text-h3 font-bold text-text">{buyCount}</p>
        </div>
        <div>
          <p className="text-small text-muted">Sells</p>
          <p className="text-h3 font-bold text-text">{sellCount}</p>
        </div>
        <div>
          <p className="text-small text-muted">Latest</p>
          <p className="truncate text-body font-bold text-text">
            {transactions[0] ? formatTransactionDate(transactions[0].createdAt) : '-'}
          </p>
        </div>
      </div>
    </Card>
  )
}

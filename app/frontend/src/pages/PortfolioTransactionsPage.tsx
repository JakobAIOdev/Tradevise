import BackLink from '../components/BackLink'
import Card from '../components/Card'
import PageTitle from '../components/PageTitle'
import TransactionsSummary from '../components/transactions/TransactionsSummary'
import TransactionsTable from '../components/transactions/TransactionsTable'
import { usePortfolioTransactions } from '../hooks/usePortfolioTransactions'
import { useStockMetadata } from '../hooks/useStockMetadata'

export default function PortfolioTransactionsPage() {
  const { data, isError, isLoading } = usePortfolioTransactions()
  const transactions = data?.transactions ?? []
  const assetsBySymbol = useStockMetadata(transactions.map((transaction) => transaction.symbol))

  return (
    <div className="flex flex-col gap-25">
      <div>
        <BackLink />
        <PageTitle title="Transactions" />
      </div>

      <TransactionsSummary
        portfolioName={data?.portfolioName}
        transactions={transactions}
        isLoading={isLoading}
      />

      {isError ? (
        <Card as="section">
          <p className="text-body text-muted">Could not load transactions.</p>
        </Card>
      ) : (
        <TransactionsTable transactions={transactions} assetsBySymbol={assetsBySymbol} />
      )}
    </div>
  )
}

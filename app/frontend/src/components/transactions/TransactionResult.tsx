import type { PortfolioTransaction } from '../../types'
import { formatSignedMoney, formatSignedPercent } from '../../utils/format'
import { getSignedTrendTextClass } from '../../utils/trend'

export default function TransactionResult({ transaction }: { transaction: PortfolioTransaction }) {
  const profitLoss = transaction.realizedProfitLoss
  const profitLossPercent = transaction.realizedProfitLossPercent

  if (transaction.type !== 'SELL' || profitLoss == null || !Number.isFinite(profitLoss)) {
    return <span className="text-muted">-</span>
  }

  return (
    <span className={`font-bold ${getSignedTrendTextClass(profitLoss)}`}>
      {formatSignedMoney(profitLoss)}
      {profitLossPercent != null && Number.isFinite(profitLossPercent) && (
        <span className="ml-4 text-small">({formatSignedPercent(profitLossPercent)})</span>
      )}
    </span>
  )
}

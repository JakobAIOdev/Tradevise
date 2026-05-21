import type { StockMetadata } from '../hooks/useStockMetadata'
import type { PortfolioTransaction } from '../types'

export function buildTransactionLinkState(transaction: PortfolioTransaction, asset: StockMetadata) {
  return {
    stock: {
      name: asset.name,
      ticker: transaction.symbol,
      change: 0,
      logo: asset.logoUrl,
      price: transaction.price,
      positiveChange: true,
    },
  }
}

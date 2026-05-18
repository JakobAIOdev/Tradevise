import type { PortfolioTableRow } from './TableColumns'

export function buildHoldingLinkState(item: PortfolioTableRow) {
  return {
    stock: {
      name: item.displayName,
      ticker: item.symbol,
      change: item.todayChangePercent ?? 0,
      logo: item.logoUrl ?? '',
      price: item.currentPrice,
      changeValue: item.todayChange,
      positiveChange: item.todayChange >= 0,
    },
  }
}

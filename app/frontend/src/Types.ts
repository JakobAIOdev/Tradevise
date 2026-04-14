export interface Stock {
  name: string
  ticker: string
  change: number
  logo: string
}

export type StockSuggestion = {
  symbol: string
  name: string
  type: 'STOCK' | 'ETF' | 'CRYPTO'
  logoUrl: string | null
}

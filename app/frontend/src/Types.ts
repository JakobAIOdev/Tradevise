export interface Stock {
  name: string
  ticker: string
  change: number
  logo: string
  price?: number
  changeValue?: number
  positiveChange?: boolean
}

export type StockSuggestion = {
  symbol: string
  name: string
  type: 'STOCK' | 'ETF' | 'CRYPTO'
  logoUrl: string | null
}

export interface Statistic {
  label: string
  value: number | string
  suffix?: string
}

export type StockStatistics = {
  symbol: string
  status: 'READY' | 'BOOTSTRAPPING'
  name: string | null
  currency: string | null
  exchange: string | null
  previousClose: number | null
  dayHigh: number | null
  dayLow: number | null
  fiftyTwoWeekHigh: number | null
  fiftyTwoWeekLow: number | null
  volume: number | null
  updatedAt: string | null
}

export type PortfolioHolding = {
  id: string
  symbol: string
  quantity: number
  averagePrice: number
  currentPrice: number
  marketValue: number
  profitLoss: number
}

export type Portfolio = {
  userId: string
  cash: number
  holdingsValue: number
  totalValue: number
  holdings: PortfolioHolding[]
}

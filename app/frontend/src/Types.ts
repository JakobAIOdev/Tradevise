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

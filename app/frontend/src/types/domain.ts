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
  previousClose: number | null
  marketValue: number
  profitLoss: number
  todayChange: number
  todayBaselineValue: number
}

export type Portfolio = {
  portfolioId: string
  portfolioName: string
  userId: string
  cash: number
  holdingsValue: number
  totalValue: number
  todayChange: number
  todayChangePercent: number
  holdings: PortfolioHolding[]
  todayBaselineValue: number
}

export type TradeType = 'BUY' | 'SELL'

export type PortfolioTransaction = {
  id: string
  symbol: string
  type: TradeType
  quantity: number
  price: number
  total: number
  realizedProfitLoss?: number | null
  realizedProfitLossPercent?: number | null
  createdAt: string
}

export type PortfolioTransactionsResponse = {
  portfolioId: string
  portfolioName: string
  userId: string
  transactions: PortfolioTransaction[]
}

export type PortfolioSummary = {
  id: string
  name: string
  cash: number
  totalValue?: number
  isDefault: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type PortfolioListResponse = {
  activePortfolioId: string
  portfolios: PortfolioSummary[]
}

export type LeaderboardMetric = 'total' | 'seasonal'

export type LeaderboardEntry = {
  portfolioId: string
  portfolioName: string
  userId: string
  username: string
  totalValue: number
  seasonGainPercent: number | null
  rank: number
  isCurrentUser: boolean
  isOwnPortfolio: boolean
}

export type Leaderboard = {
  metric: LeaderboardMetric
  seasonStart: string
  entries: LeaderboardEntry[]
}

export type GroupSummary = {
  id: string
  name: string
  code: string
  ownerId: string
  createdAt: string
  _count: {
    members: number
  }
}

export type GroupDetail = {
  id: string
  name: string
  code: string
  ownerId: string
  createdAt: string
  members: Array<{
    role: 'OWNER' | 'MEMBER'
    joinedAt: string
    user: {
      id: string
      username: string
    }
    portfolio: {
      id: string
      name: string
    }
  }>
}

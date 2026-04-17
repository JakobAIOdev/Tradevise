export type ChartRange = 'intraday' | '1M' | '6M' | '1Y' | '3Y' | 'ALL'

export type GraphPoint = {
  time: number
  price: number
}

export type ChartHistorySource = 'intraday' | 'daily'

export type ChartHistoryResponse = {
  symbol: string
  range: ChartRange
  source: ChartHistorySource
  points: GraphPoint[]
}

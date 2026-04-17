import type { Portfolio } from '../types'
import type { ChartHistoryResponse } from '../types/chart'

type LiveStockEvent = {
  symbol: string
  price?: number
}

export function applyLivePriceToPortfolio(
  portfolio: Portfolio | undefined,
  payload: LiveStockEvent,
) {
  if (!portfolio || typeof payload.price !== 'number' || payload.price <= 0) {
    return { portfolio, valueDelta: 0 }
  }
  const nextPrice = payload.price

  const holding = portfolio.holdings.find((item) => item.symbol === payload.symbol)
  if (!holding) {
    return { portfolio, valueDelta: 0 }
  }

  const priceDelta = nextPrice - holding.currentPrice
  if (!Number.isFinite(priceDelta) || priceDelta === 0) {
    return { portfolio, valueDelta: 0 }
  }

  const valueDelta = holding.quantity * priceDelta
  const nextHoldings = portfolio.holdings.map((item) => {
    if (item.symbol !== payload.symbol) return item

    return {
      ...item,
      currentPrice: nextPrice,
      marketValue: item.marketValue + valueDelta,
      profitLoss: item.profitLoss + valueDelta,
      todayChange: item.todayChange + valueDelta,
    }
  })

  const nextTodayChange = portfolio.todayChange + valueDelta

  return {
    valueDelta,
    portfolio: {
      ...portfolio,
      holdings: nextHoldings,
      holdingsValue: portfolio.holdingsValue + valueDelta,
      totalValue: portfolio.totalValue + valueDelta,
      todayChange: nextTodayChange,
      todayChangePercent:
        portfolio.todayBaselineValue > 0
          ? (nextTodayChange / portfolio.todayBaselineValue) * 100
          : 0,
    },
  }
}

export function applyLiveValueDeltaToChart(
  chart: ChartHistoryResponse | undefined,
  valueDelta: number,
) {
  if (!chart || chart.points.length === 0 || valueDelta === 0) return chart

  const lastPoint = chart.points[chart.points.length - 1]
  const nextLastPoint = {
    ...lastPoint,
    price: lastPoint.price + valueDelta,
  }

  if (chart.range !== 'intraday') {
    return {
      ...chart,
      points: [...chart.points.slice(0, -1), nextLastPoint],
    }
  }

  const now = Math.floor(Date.now() / 1000)
  if (lastPoint.time === now) {
    return {
      ...chart,
      points: [...chart.points.slice(0, -1), { ...nextLastPoint, time: now }],
    }
  }

  return {
    ...chart,
    points: [...chart.points, { time: now, price: nextLastPoint.price }],
  }
}

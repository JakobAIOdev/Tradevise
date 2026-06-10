import { describe, expect, it } from 'vitest'
import { applyLivePriceToPortfolio, applyLiveValueDeltaToChart } from './portfolio-live'
import type { Portfolio } from '../types'
import type { ChartHistoryResponse } from '../types/chart'

const portfolio: Portfolio = {
  portfolioId: 'portfolio-1',
  portfolioName: 'Main Portfolio',
  userId: 'user-1',
  cash: 1000,
  holdingsValue: 200,
  totalValue: 1200,
  todayChange: 4,
  todayChangePercent: 0.4,
  todayBaselineValue: 1000,
  holdings: [
    {
      id: 'holding-1',
      symbol: 'AAPL',
      quantity: 2,
      averagePrice: 90,
      currentPrice: 100,
      previousClose: 98,
      marketValue: 200,
      profitLoss: 20,
      todayChange: 4,
      todayBaselineValue: 196,
    },
  ],
}

describe('portfolio-live', () => {
  it('updates portfolio values when a live price changes', () => {
    const result = applyLivePriceToPortfolio(portfolio, {
      symbol: 'AAPL',
      price: 110,
    })

    expect(result.valueDelta).toBe(20)
    expect(result.portfolio?.holdings[0].currentPrice).toBe(110)
    expect(result.portfolio?.holdings[0].marketValue).toBe(220)
    expect(result.portfolio?.holdingsValue).toBe(220)
    expect(result.portfolio?.totalValue).toBe(1220)
    expect(result.portfolio?.todayChange).toBe(24)
  })

  it('does not change the portfolio for an unknown symbol', () => {
    const result = applyLivePriceToPortfolio(portfolio, {
      symbol: 'MSFT',
      price: 150,
    })

    expect(result.valueDelta).toBe(0)
    expect(result.portfolio).toBe(portfolio)
  })

  it('updates the last chart point with the live value delta', () => {
    const chart: ChartHistoryResponse = {
      symbol: 'PORTFOLIO',
      range: '1M',
      source: 'daily',
      points: [
        { time: 1000, price: 1200 },
        { time: 2000, price: 1210 },
      ],
    }

    const result = applyLiveValueDeltaToChart(chart, 20)

    expect(result?.points).toEqual([
      { time: 1000, price: 1200 },
      { time: 2000, price: 1230 },
    ])
  })
})

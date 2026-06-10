import { describe, expect, it } from 'vitest'
import { buildAllocation } from './portfolio-allocation'
import type { PortfolioTableRow } from '../components/portfolio/TableColumns'

const rows: PortfolioTableRow[] = [
  {
    id: '1',
    symbol: 'AAPL',
    quantity: 2,
    averagePrice: 100,
    currentPrice: 150,
    previousClose: 145,
    marketValue: 300,
    profitLoss: 100,
    todayChange: 10,
    displayName: 'Apple',
    logoUrl: null,
    todayChangePercent: 2,
    totalPlPercent: 50,
  },
  {
    id: '2',
    symbol: 'MSFT',
    quantity: 1,
    averagePrice: 100,
    currentPrice: 200,
    previousClose: 190,
    marketValue: 200,
    profitLoss: 100,
    todayChange: 5,
    displayName: 'Microsoft',
    logoUrl: null,
    todayChangePercent: 1,
    totalPlPercent: 100,
  },
]

describe('portfolio-allocation', () => {
  it('sorts positions by market value descending', () => {
    const allocation = buildAllocation(rows, 500)

    expect(allocation[0].symbol).toBe('AAPL')
    expect(allocation[1].symbol).toBe('MSFT')
  })

  it('calculates the percentage of each postion', () => {
    const allocation = buildAllocation(rows, 500)

    expect(allocation[0].percent).toBe(60)
    expect(allocation[1].percent).toBe(40)
  })

  it('filters out positions without market value', () => {
    const allocation = buildAllocation(
      [
        ...rows,
        {
          id: '3',
          symbol: 'TSLA',
          quantity: 0,
          averagePrice: 0,
          currentPrice: 0,
          previousClose: null,
          marketValue: 0,
          profitLoss: 0,
          todayChange: 0,
          displayName: 'Tesla',
          logoUrl: null,
          todayChangePercent: null,
          totalPlPercent: 0,
        },
      ],
      500,
    )

    expect(allocation.map((item) => item.symbol)).toEqual(['AAPL', 'MSFT'])
  })
})

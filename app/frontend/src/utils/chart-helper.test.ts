import { formatDate, formatPrice, getIntradayAxisConfig } from './chart-helper'

describe('chart-helper', () => {
  it('formats intraday timestamp as Berlin time', () => {
    const timestamp = Date.UTC(2024, 4, 20, 13, 45) / 1000
    expect(formatDate(timestamp, 'intraday')).toBe('15:45')
  })

  it('formats long chart ranges with a year', () => {
    const timestamp = Date.UTC(2024, 4, 20, 13, 45) / 1000

    expect(formatDate(timestamp, '1Y')).toBe('20. Mai 2024')
  })

  it('formats short chart ranges without a year', () => {
    const timestamp = Date.UTC(2024, 4, 20, 13, 45) / 1000

    expect(formatDate(timestamp, '1M')).toBe('20. Mai')
  })

  it('formats prices with euro symbol', () => {
    expect(formatPrice(123.4)).toBe('123,40 €')
  })

  it('builds intraday ticks for the selected day', () => {
    const timestamp = Date.UTC(2024, 4, 20, 13, 45) / 1000

    const result = getIntradayAxisConfig(timestamp)

    expect(result.domain[0]).toBe(Date.UTC(2024, 4, 20, 5, 0) / 1000)
    expect(result.domain[1]).toBe(Date.UTC(2024, 4, 20, 21, 0) / 1000)
    expect(result.ticks).toHaveLength(5)
  })
})

import { describe, expect, it } from 'vitest'
import { getQuantityFromTradeInput, parseNumberInput } from './trade-order'

describe('trade-order', () => {
  it('parses normal numbers and comma decimals', () => {
    expect(parseNumberInput('250')).toBe(250)
    expect(parseNumberInput('2,5')).toBe(2.5)
  })

  it('returns 0 for empty input', () => {
    expect(parseNumberInput('')).toBe(0)
    expect(parseNumberInput('   ')).toBe(0)
  })

  it('calculates quantity from an amount', () => {
    const quantity = getQuantityFromTradeInput({
      mode: 'amount',
      parsedValue: 250,
      currentPrice: 100,
    })

    expect(quantity).toBe(2.5)
  })

  it('uses the entered value directly in shares mode', () => {
    const quantity = getQuantityFromTradeInput({
      mode: 'shares',
      parsedValue: 3,
      currentPrice: 100,
    })

    expect(quantity).toBe(3)
  })

  it('returns 0 for invalid or negative values', () => {
    expect(
      getQuantityFromTradeInput({
        mode: 'amount',
        parsedValue: Number.NaN,
        currentPrice: 100,
      }),
    ).toBe(0)

    expect(
      getQuantityFromTradeInput({
        mode: 'amount',
        parsedValue: -50,
        currentPrice: 100,
      }),
    ).toBe(0)
  })

  it('returns 0 when amount mode has no current price', () => {
    expect(
      getQuantityFromTradeInput({
        mode: 'amount',
        parsedValue: 250,
        currentPrice: null,
      }),
    ).toBe(0)
  })
})

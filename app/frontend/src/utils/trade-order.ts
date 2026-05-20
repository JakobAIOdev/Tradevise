export type TradeInputMode = 'amount' | 'shares'

export function parseNumberInput(value: string) {
  const normalizedValue = value.replace(',', '.').trim()
  if (!normalizedValue) return 0

  const parsedValue = Number(normalizedValue)
  return Number.isFinite(parsedValue) ? parsedValue : Number.NaN
}

export function getQuantityFromTradeInput({
  mode,
  parsedValue,
  currentPrice,
}: {
  mode: TradeInputMode
  parsedValue: number
  currentPrice: number | null
}) {
  if (!Number.isFinite(parsedValue) || parsedValue <= 0) return 0
  if (mode === 'shares') return parsedValue
  if (!currentPrice) return 0

  return parsedValue / currentPrice
}

export function getOrderAmount(quantity: number, currentPrice: number | null) {
  return currentPrice ? quantity * currentPrice : 0
}

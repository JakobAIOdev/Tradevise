export type Trend = 'positive' | 'negative' | 'neutral'

export const getTrend = (value: number): Trend =>
  value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral'

export function getTrendTextClass(trend?: Trend, neutralClass = 'text-text') {
  if (trend === 'positive') return 'text-bullish'
  if (trend === 'negative') return 'text-bearish'

  return neutralClass
}

export function getSignedTrendTextClass(
  value: number | null | undefined,
  fallbackClass = 'text-muted',
) {
  if (typeof value !== 'number') return fallbackClass

  return value >= 0 ? 'text-bullish' : 'text-bearish'
}

export function getTrendDirectionTextClass(isPositive: boolean) {
  return isPositive ? 'text-bullish' : 'text-bearish'
}

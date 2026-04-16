import type { ChartRange } from '../hooks/useStockChart'

export function getIntradayAxisConfig(anchorTimestamp?: number) {
  const anchorDate = anchorTimestamp ? new Date(anchorTimestamp * 1000) : new Date()
  const year = anchorDate.getUTCFullYear()
  const month = anchorDate.getUTCMonth()
  const day = anchorDate.getUTCDate()

  const atTime = (hour: number, minute = 0) =>
    Date.UTC(year, month, day, hour, minute) / 1000

  return {
    domain: [atTime(7), atTime(23)] as const,
    ticks: [atTime(7), atTime(11), atTime(15), atTime(19), atTime(23)],
  }
}

export const formatDate = (timestamp: number, range: ChartRange) => {
  const date = new Date(timestamp * 1000)

  if (range === '1D')
    return new Intl.DateTimeFormat('de-AT', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
    }).format(date)
  else if (range === '1Y' || range === 'ALL')
    return new Intl.DateTimeFormat('de-AT', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date)
  else
    return new Intl.DateTimeFormat('de-AT', {
      day: 'numeric',
      month: 'short',
    }).format(date)
}

export const formatPrice = (price: number) => {
  return (
    new Intl.NumberFormat('de-AT', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price) + ' €'
  )
}

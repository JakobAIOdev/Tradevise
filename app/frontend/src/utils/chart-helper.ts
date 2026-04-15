import type { ChartRange } from '../hooks/useStockChart'

export function getIntradayAxisConfig(now = new Date()) {
  const year = now.getFullYear()
  const month = now.getMonth()
  const day = now.getDate()

  const atTime = (hour: number, minute = 0) =>
    new Date(year, month, day, hour, minute).getTime() / 1000

  return {
    domain: [atTime(9), atTime(17, 30)] as const,
    ticks: [atTime(9), atTime(11), atTime(13), atTime(15), atTime(17)],
  }
}

export const formatDate = (timestamp: number, range: ChartRange) => {
  const date = new Date(timestamp * 1000)

  if (range === '1D')
    return new Intl.DateTimeFormat('de-AT', {
      hour: '2-digit',
      minute: '2-digit',
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

import type { ChartRange } from '../hooks/useStockChart'

export const formatDate = (timestamp: number, range: ChartRange) => {
  const date = new Date(timestamp * 1000)

  if (range === '1D')
    return Intl.DateTimeFormat('de-AT', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  else
    return Intl.DateTimeFormat('de-AT', {
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

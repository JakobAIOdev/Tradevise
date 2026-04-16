import { useQuery } from '@tanstack/react-query'
import { buildApiUrl, protectedFetch } from '../lib/api'
import type { StockStatistics } from '../Types'

async function fetchStockStatistics(ticker: string): Promise<StockStatistics> {
  const res = await protectedFetch(buildApiUrl(`/stocks/${encodeURIComponent(ticker)}/statistics`))

  if (!res.ok) {
    throw new Error(`Statistics request failed with status ${res.status}`)
  }

  return (await res.json()) as StockStatistics
}

export function useStockStatistics(ticker: string) {
  return useQuery({
    queryKey: ['stock-statistics', ticker],
    queryFn: () => fetchStockStatistics(ticker),
    enabled: ticker.trim().length > 0,
    staleTime: 1000 * 60 * 5,
  })
}

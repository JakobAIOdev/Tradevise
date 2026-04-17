import { useQuery } from '@tanstack/react-query'
import { buildApiUrl, protectedFetch } from '../lib/api'
import type { ChartHistoryResponse, ChartRange } from '../types/chart'

async function fetchPortfolioChart(range: ChartRange): Promise<ChartHistoryResponse> {
  const params = new URLSearchParams({ range })
  const res = await protectedFetch(buildApiUrl(`/portfolio/chart?${params.toString()}`))

  if (!res.ok) {
    throw new Error(`Portfolio chart request failed with status ${res.status}`)
  }

  return (await res.json()) as ChartHistoryResponse
}

export function usePortfolioChart(range: ChartRange) {
  return useQuery({
    queryKey: ['portfolio-chart', range],
    queryFn: () => fetchPortfolioChart(range),
    staleTime: 1000 * 30,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}

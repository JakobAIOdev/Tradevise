import { useQuery } from '@tanstack/react-query'
import { buildApiUrl, protectedFetch } from '../lib/api'
import type { ChartHistoryResponse, ChartRange } from '../types/chart'

async function fetchStockChart(ticker: string, range: ChartRange): Promise<ChartHistoryResponse> {
  const params = new URLSearchParams({ range })
  const res = await protectedFetch(
    buildApiUrl(`/stocks/${encodeURIComponent(ticker)}/chart?${params.toString()}`),
  )

  if (!res.ok) {
    throw new Error(`Chart request failed with status ${res.status}`)
  }

  return (await res.json()) as ChartHistoryResponse
}

export function useStockChart(ticker: string, range: ChartRange) {
  return useQuery<ChartHistoryResponse>({
    queryKey: ['stock-chart', ticker, range],
    queryFn: () => fetchStockChart(ticker, range),
    enabled: ticker.trim().length > 0,
    staleTime: 1000 * 30,
  })
}

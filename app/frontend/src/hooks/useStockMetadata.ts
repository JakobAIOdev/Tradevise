import { useQueries } from '@tanstack/react-query'
import { buildStockLogoUrl } from '../utils/stocks'
import { fetchStockStatistics } from './useStockStatistics'

export type StockMetadata = {
  name: string
  logoUrl: string
}

export function useStockMetadata(symbols: string[]) {
  const uniqueSymbols = [...new Set(symbols)].sort()
  const queries = useQueries({
    queries: uniqueSymbols.map((symbol) => ({
      queryKey: ['stock-statistics', symbol],
      queryFn: () => fetchStockStatistics(symbol),
      staleTime: 1000 * 60 * 5,
    })),
  })

  return new Map(
    uniqueSymbols.map((symbol, index) => [
      symbol,
      {
        name: queries[index]?.data?.name?.trim() || symbol,
        logoUrl: buildStockLogoUrl(symbol),
      },
    ]),
  )
}

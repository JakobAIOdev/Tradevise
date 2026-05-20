import { useQuery } from '@tanstack/react-query'
import type { Stock } from '../types'
import { buildApiUrl, protectedFetch } from '../lib/api'
import { useLiveStockUpdates } from './useLiveStockUpdates'

export const DISCOVER_STOCKS_QUERY_KEY = ['discover-stocks'] as const

async function fetchDiscoverStocks(): Promise<Stock[]> {
  const res = await protectedFetch(buildApiUrl('/stocks/discover'))
  if (!res.ok) throw new Error('Discover stocks failed')

  return (await res.json()) as Stock[]
}

export function useDiscoverStocks() {
  const query = useQuery({
    queryKey: DISCOVER_STOCKS_QUERY_KEY,
    queryFn: fetchDiscoverStocks,
  })

  useLiveStockUpdates(DISCOVER_STOCKS_QUERY_KEY, query.data)

  return query
}

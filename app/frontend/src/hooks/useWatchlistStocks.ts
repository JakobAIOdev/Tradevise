import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Stock } from '../types'
import { buildApiUrl, protectedFetch } from '../lib/api'
import { useLiveStockUpdates } from './useLiveStockUpdates'

export const WATCHLIST_STOCKS_QUERY_KEY = ['watchlist-stocks'] as const

async function fetchWatchlistStocks(): Promise<Stock[]> {
  const res = await protectedFetch(buildApiUrl('/stocks/watchlist'))
  if (!res.ok) throw new Error('Watchlist stocks failed')

  return (await res.json()) as Stock[]
}

async function addWatchlistStock(ticker: string): Promise<Stock> {
  const res = await protectedFetch(buildApiUrl(`/stocks/watchlist/${encodeURIComponent(ticker)}`), {
    method: 'POST',
  })
  if (!res.ok) throw new Error('Add watchlist stock failed')

  return (await res.json()) as Stock
}

async function removeWatchlistStock(ticker: string) {
  const res = await protectedFetch(buildApiUrl(`/stocks/watchlist/${encodeURIComponent(ticker)}`), {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('Remove watchlist stock failed')
}

function addStockToCache(stocks: Stock[] = [], stock: Stock) {
  if (stocks.some((item) => item.ticker === stock.ticker)) return stocks
  return [...stocks, stock]
}

function removeStockFromCache(stocks: Stock[] = [], ticker: string) {
  return stocks.filter((stock) => stock.ticker !== ticker)
}

export function useWatchlistStocks() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: WATCHLIST_STOCKS_QUERY_KEY,
    queryFn: fetchWatchlistStocks,
  })

  useLiveStockUpdates(WATCHLIST_STOCKS_QUERY_KEY, query.data)

  const addMutation = useMutation({
    mutationFn: addWatchlistStock,
    onSuccess: (stock) => {
      queryClient.setQueryData<Stock[]>(WATCHLIST_STOCKS_QUERY_KEY, (stocks) =>
        addStockToCache(stocks, stock),
      )
    },
  })

  const removeMutation = useMutation({
    mutationFn: removeWatchlistStock,
    onSuccess: (_data, ticker) => {
      queryClient.setQueryData<Stock[]>(WATCHLIST_STOCKS_QUERY_KEY, (stocks) =>
        removeStockFromCache(stocks, ticker),
      )
    },
  })

  return {
    ...query,
    addToWatchlist: addMutation.mutateAsync,
    removeFromWatchlist: removeMutation.mutateAsync,
    isUpdating: addMutation.isPending || removeMutation.isPending,
  }
}

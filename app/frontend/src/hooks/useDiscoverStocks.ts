import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Stock } from '../types'
import { buildApiUrl, protectedFetch } from '../lib/api'
import { useAuthStore } from '../stores/authStore'

type LiveStockEvent = {
  symbol: string
  price?: number
  change?: number
  changePercent?: number
}

const QUERY_KEY = ['discover-stocks']

async function fetchDiscoverStocks(): Promise<Stock[]> {
  const res = await protectedFetch(buildApiUrl('/stocks/discover'))
  if (!res.ok) throw new Error('Discover stocks failed')

  return (await res.json()) as Stock[]
}

export function useDiscoverStocks() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchDiscoverStocks,
  })

  useEffect(() => {
    if (!accessToken) return
    if (!query.data?.length) return

    const symbols = query.data.map((stock) => stock.ticker).join(',')

    const params = new URLSearchParams({
      symbols,
      access_token: accessToken,
    })
    const events = new EventSource(buildApiUrl(`/stocks/live?${params.toString()}`))

    events.onmessage = (event) => {
      const payload = JSON.parse(event.data) as LiveStockEvent
      queryClient.setQueryData<Stock[]>(QUERY_KEY, (stocks) => {
        if (!stocks) return stocks

        return stocks.map((stock) => {
          if (stock.ticker !== payload.symbol) return stock

          const price =
            typeof payload.price === 'number' && payload.price > 0 ? payload.price : stock.price

          return {
            ...stock,
            price,
            change: payload.changePercent ?? stock.change,
            changeValue: payload.change ?? stock.changeValue,
          }
        })
      })
    }

    return () => events.close()
  }, [accessToken, query.data, queryClient])

  return query
}

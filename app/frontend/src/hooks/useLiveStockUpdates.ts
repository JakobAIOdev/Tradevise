import { useEffect, useMemo } from 'react'
import type { QueryKey } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'
import { buildApiUrl } from '../lib/api'
import { useAuthStore } from '../stores/authStore'
import type { Stock } from '../types'

type LiveStockEvent = {
  symbol: string
  price?: number
  change?: number
  changePercent?: number
}

function applyLiveStockEvent(stock: Stock, event: LiveStockEvent): Stock {
  if (stock.ticker !== event.symbol) return stock

  const price = typeof event.price === 'number' && event.price > 0 ? event.price : stock.price

  return {
    ...stock,
    price,
    change: event.changePercent ?? stock.change,
    changeValue: event.change ?? stock.changeValue,
  }
}

export function useLiveStockUpdates(queryKey: QueryKey, stocks: Stock[] | undefined) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const queryClient = useQueryClient()
  const symbols = useMemo(() => stocks?.map((stock) => stock.ticker).join(',') ?? '', [stocks])

  useEffect(() => {
    if (!accessToken || !symbols) return

    const params = new URLSearchParams({
      symbols,
      access_token: accessToken,
    })
    const events = new EventSource(buildApiUrl(`/stocks/live?${params.toString()}`))

    events.onmessage = (event) => {
      const payload = JSON.parse(event.data) as LiveStockEvent

      queryClient.setQueryData<Stock[]>(queryKey, (currentStocks) =>
        currentStocks?.map((stock) => applyLiveStockEvent(stock, payload)),
      )
    }

    return () => events.close()
  }, [accessToken, queryClient, queryKey, symbols])
}

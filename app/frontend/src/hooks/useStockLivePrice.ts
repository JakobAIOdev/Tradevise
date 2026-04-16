import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Stock } from '../Types'
import { buildApiUrl } from '../lib/api'
import { useAuthStore } from '../stores/authStore'

type LiveStockEvent = {
  symbol: string
  price?: number
  change?: number
  changePercent?: number
  bootstrapDone?: boolean
}

export function useStockLivePrice(ticker: string) {
  const accessToken = useAuthStore((state) => state.accessToken)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!ticker || !accessToken) return

    const params = new URLSearchParams({ access_token: accessToken })
    const events = new EventSource(
      buildApiUrl(`/stocks/${encodeURIComponent(ticker)}/live?${params.toString()}`),
    )

    events.onmessage = (event) => {
      const payload = JSON.parse(event.data) as LiveStockEvent

      if (payload.bootstrapDone) {
        void queryClient.invalidateQueries({ queryKey: ['stock-chart', ticker] })
        void queryClient.invalidateQueries({ queryKey: ['stock-statistics', ticker] })
      }

      queryClient.setQueryData<Stock>(['stock-detail', ticker], (stock) => {
        if (!stock || stock.ticker !== payload.symbol) return stock

        const price =
          typeof payload.price === 'number' && payload.price > 0 ? payload.price : stock.price
        const change = payload.changePercent ?? stock.change
        return {
          ...stock,
          price,
          change,
          changeValue: payload.change ?? stock.changeValue,
          positiveChange: change >= 0,
        }
      })
    }

    return () => events.close()
  }, [accessToken, queryClient, ticker])
}

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { buildApiUrl } from '../lib/api'
import { useAuthStore } from '../stores/authStore'
import type { Portfolio } from '../types'
import type { ChartHistoryResponse } from '../types/chart'
import {
  applyLivePriceToPortfolio,
  applyLiveValueDeltaToChart,
} from '../utils/portfolio-live'
import { useActivePortfolioId } from './usePortfolios'

type LiveStockEvent = {
  symbol: string
  price?: number
}

export function usePortfolioLive(symbols: string[]) {
  const accessToken = useAuthStore((state) => state.accessToken)
  const queryClient = useQueryClient()
  const activePortfolioId = useActivePortfolioId()
  const symbolKey = symbols.join(',')

  useEffect(() => {
    if (!accessToken || !activePortfolioId || symbolKey.length === 0) return

    const params = new URLSearchParams({
      symbols: symbolKey,
      access_token: accessToken,
    })

    const events = new EventSource(buildApiUrl(`/stocks/live?${params.toString()}`))

    events.onmessage = (event) => {
      const payload = JSON.parse(event.data) as LiveStockEvent
      if (typeof payload.price !== 'number' || payload.price <= 0) return

      let valueDelta = 0

      queryClient.setQueryData<Portfolio>(['portfolio', activePortfolioId], (portfolio) => {
        const result = applyLivePriceToPortfolio(portfolio, payload)
        valueDelta = result.valueDelta
        return result.portfolio
      })

      if (valueDelta === 0) return

      queryClient.setQueriesData<ChartHistoryResponse>(
        { queryKey: ['portfolio-chart', activePortfolioId] },
        (chart) => applyLiveValueDeltaToChart(chart, valueDelta),
      )
    }

    return () => {
      events.close()
    }
  }, [accessToken, activePortfolioId, queryClient, symbolKey])
}

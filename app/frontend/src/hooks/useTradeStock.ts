import { useMutation, useQueryClient } from '@tanstack/react-query'
import { buildApiUrl, protectedFetch } from '../lib/api'
import { useActivePortfolioId } from './usePortfolios'

type TradeType = 'buy' | 'sell'

type TradeStockBody = {
  symbol: string
  quantity: number
}

async function tradeStock(type: TradeType, body: TradeStockBody) {
  const res = await protectedFetch(buildApiUrl(`/portfolio/${type}`), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const error = ((await res.json().catch(() => null)) as { message?: string }) || null
    throw new Error(error?.message ?? `${type} failed`)
  }

  return res.json()
}

export function useTradeStock(type: TradeType) {
  const queryClient = useQueryClient()
  const activePortfolioId = useActivePortfolioId()

  return useMutation({
    mutationFn: (body: TradeStockBody) => tradeStock(type, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['portfolio', activePortfolioId] })
      void queryClient.invalidateQueries({ queryKey: ['portfolio-chart', activePortfolioId] })
      void queryClient.invalidateQueries({ queryKey: ['portfolio-transactions', activePortfolioId] })
      void queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
      void queryClient.invalidateQueries({ queryKey: ['groups'] })
    },
  })
}

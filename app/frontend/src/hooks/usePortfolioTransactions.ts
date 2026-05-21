import { useQuery } from '@tanstack/react-query'
import { buildApiUrl, protectedFetch } from '../lib/api'
import type { PortfolioTransactionsResponse } from '../types'
import { useActivePortfolioId } from './usePortfolios'

async function fetchPortfolioTransactions(): Promise<PortfolioTransactionsResponse> {
  const res = await protectedFetch(buildApiUrl('/portfolio/transactions'))

  if (!res.ok) {
    throw new Error(`Portfolio transactions request failed with status ${res.status}`)
  }

  return (await res.json()) as PortfolioTransactionsResponse
}

export function usePortfolioTransactions() {
  const activePortfolioId = useActivePortfolioId()

  return useQuery({
    queryKey: ['portfolio-transactions', activePortfolioId],
    queryFn: fetchPortfolioTransactions,
    enabled: Boolean(activePortfolioId),
    staleTime: 1000 * 30,
  })
}

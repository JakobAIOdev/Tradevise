import { useQuery } from '@tanstack/react-query'
import { buildApiUrl, protectedFetch } from '../lib/api'
import type { Portfolio } from '../types'
import { useActivePortfolioId } from './usePortfolios'

type UsePortfolioOptions = {
  refetchInterval?: number | false
}

async function fetchPortfolio(): Promise<Portfolio> {
  const res = await protectedFetch(buildApiUrl('/portfolio'))

  if (!res.ok) {
    throw new Error(`Portfolio request failed with status ${res.status}`)
  }

  return (await res.json()) as Portfolio
}

export function usePortfolio(options?: UsePortfolioOptions) {
  const activePortfolioId = useActivePortfolioId()

  return useQuery({
    queryKey: ['portfolio', activePortfolioId],
    queryFn: fetchPortfolio,
    enabled: Boolean(activePortfolioId),
    staleTime: 1000 * 30,
    refetchInterval: options?.refetchInterval ?? false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}

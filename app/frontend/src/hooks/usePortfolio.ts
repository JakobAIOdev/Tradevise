import { useQuery } from '@tanstack/react-query'
import { buildApiUrl, protectedFetch } from '../lib/api'
import type { Portfolio } from '../Types'

async function fetchPortfolio(): Promise<Portfolio> {
  const res = await protectedFetch(buildApiUrl('/portfolio'))

  if (!res.ok) {
    throw new Error(`Portfolio request failed with status ${res.status}`)
  }

  return (await res.json()) as Portfolio
}

export function usePortfolio() {
  return useQuery({
    queryKey: ['portfolio'],
    queryFn: fetchPortfolio,
    staleTime: 1000 * 30,
  })
}

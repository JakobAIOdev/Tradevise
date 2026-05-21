import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { buildApiUrl, protectedFetch } from '../lib/api'
import type { PortfolioListResponse, PortfolioSummary } from '../types'

export const PORTFOLIOS_QUERY_KEY = ['portfolios'] as const
const PORTFOLIO_CONTEXT_QUERY_KEYS = [
  PORTFOLIOS_QUERY_KEY,
  ['portfolio'],
  ['portfolio-chart'],
  ['portfolio-transactions'],
  ['leaderboard'],
  ['groups'],
] as const

async function getResponseError(res: Response, fallback: string) {
  const error = ((await res.json().catch(() => null)) as { message?: string }) || null
  return new Error(error?.message ?? fallback)
}

async function fetchPortfolios(): Promise<PortfolioListResponse> {
  const res = await protectedFetch(buildApiUrl('/portfolios'))

  if (!res.ok) {
    throw new Error(`Portfolios request failed with status ${res.status}`)
  }

  return (await res.json()) as PortfolioListResponse
}

async function createPortfolio(name: string): Promise<PortfolioSummary> {
  const res = await protectedFetch(buildApiUrl('/portfolios'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, setActive: true }),
  })

  if (!res.ok) {
    throw await getResponseError(res, `Create portfolio failed with status ${res.status}`)
  }

  return (await res.json()) as PortfolioSummary
}

async function setActivePortfolio(portfolioId: string) {
  const res = await protectedFetch(buildApiUrl('/portfolios/active'), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ portfolioId }),
  })

  if (!res.ok) {
    throw new Error(`Set active portfolio failed with status ${res.status}`)
  }

  return (await res.json()) as { activePortfolioId: string }
}

async function updatePortfolio({
  portfolioId,
  name,
}: {
  portfolioId: string
  name: string
}): Promise<PortfolioSummary> {
  const res = await protectedFetch(buildApiUrl(`/portfolios/${encodeURIComponent(portfolioId)}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })

  if (!res.ok) {
    throw await getResponseError(res, `Update portfolio failed with status ${res.status}`)
  }

  return (await res.json()) as PortfolioSummary
}

async function deletePortfolio(portfolioId: string) {
  const res = await protectedFetch(buildApiUrl(`/portfolios/${encodeURIComponent(portfolioId)}`), {
    method: 'DELETE',
  })

  if (!res.ok) {
    throw await getResponseError(res, `Delete portfolio failed with status ${res.status}`)
  }

  return (await res.json()) as {
    deletedPortfolioId: string
    activePortfolioId: string
  }
}

export function usePortfolios() {
  return useQuery({
    queryKey: PORTFOLIOS_QUERY_KEY,
    queryFn: fetchPortfolios,
    staleTime: 1000 * 60,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}

export function useActivePortfolioId() {
  const { data } = usePortfolios()
  return data?.activePortfolioId
}

function invalidatePortfolioContext(queryClient: ReturnType<typeof useQueryClient>) {
  PORTFOLIO_CONTEXT_QUERY_KEYS.forEach((queryKey) => {
    void queryClient.invalidateQueries({ queryKey })
  })
}

export function useCreatePortfolio() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createPortfolio,
    onSuccess: () => invalidatePortfolioContext(queryClient),
  })
}

export function useSetActivePortfolio() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: setActivePortfolio,
    onSuccess: () => invalidatePortfolioContext(queryClient),
  })
}

export function useUpdatePortfolio() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updatePortfolio,
    onSuccess: () => invalidatePortfolioContext(queryClient),
  })
}

export function useDeletePortfolio() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deletePortfolio,
    onSuccess: () => invalidatePortfolioContext(queryClient),
  })
}

import { useQuery } from '@tanstack/react-query'
import { buildApiUrl, protectedFetch } from '../lib/api'
import type { Leaderboard, LeaderboardMetric } from '../types'

async function fetchLeaderboard(metric: LeaderboardMetric): Promise<Leaderboard> {
  const params = new URLSearchParams({ metric })
  const res = await protectedFetch(buildApiUrl(`/portfolio/leaderboard?${params.toString()}`))

  if (!res.ok) {
    throw new Error(`Leaderboard request failed with status ${res.status}`)
  }

  return (await res.json()) as Leaderboard
}

export function useLeaderboard(metric: LeaderboardMetric) {
  return useQuery({
    queryKey: ['leaderboard', metric],
    queryFn: () => fetchLeaderboard(metric),
    staleTime: 1000 * 30,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}

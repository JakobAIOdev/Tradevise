import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { buildApiUrl, protectedFetch } from '../lib/api'
import type { GroupSummary, GroupDetail, LeaderboardMetric, Leaderboard } from '../types'
import { useActivePortfolioId } from './usePortfolios'

async function fetchGroups(): Promise<GroupSummary[]> {
  const res = await protectedFetch(buildApiUrl('/groups'))

  if (!res.ok) {
    throw new Error(`Groups request failed with status ${res.status}`)
  }

  return (await res.json()) as GroupSummary[]
}

async function createGroup(name: string): Promise<GroupSummary> {
  const res = await protectedFetch(buildApiUrl('/groups'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })

  if (!res.ok) {
    throw new Error(`Create group request failed with status ${res.status}`)
  }

  return (await res.json()) as GroupSummary
}

async function joinGroup(code: string): Promise<GroupSummary> {
  const res = await protectedFetch(buildApiUrl('/groups/join'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  })

  if (!res.ok) {
    throw new Error(`Join group request failed with status ${res.status}`)
  }

  return (await res.json()) as GroupSummary
}

async function fetchGroup(groupId: string): Promise<GroupDetail> {
  const res = await protectedFetch(buildApiUrl(`/groups/${groupId}`))

  if (!res.ok) {
    throw new Error(`Group request failed with status ${res.status}`)
  }

  return (await res.json()) as GroupDetail
}

async function fetchGroupLeaderboard(
  groupId: string,
  metric: LeaderboardMetric,
): Promise<Leaderboard> {
  const params = new URLSearchParams({ metric })
  const res = await protectedFetch(buildApiUrl(`/groups/${groupId}/leaderboard?${params}`))

  if (!res.ok) {
    throw new Error(`Group leaderboard request failed with status ${res.status}`)
  }

  return (await res.json()) as Leaderboard
}

export function useGroups() {
  const activePortfolioId = useActivePortfolioId()

  return useQuery({
    queryKey: ['groups', activePortfolioId],
    queryFn: fetchGroups,
    enabled: Boolean(activePortfolioId),
  })
}

export function useCreateGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createGroup,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['groups'] })
    },
  })
}

export function useJoinGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: joinGroup,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['groups'] })
    },
  })
}

export function useGroup(groupId: string) {
  const activePortfolioId = useActivePortfolioId()

  return useQuery({
    queryKey: ['groups', activePortfolioId, groupId],
    queryFn: () => fetchGroup(groupId),
    enabled: Boolean(activePortfolioId && groupId),
  })
}

export function useGroupLeaderboard(groupId: string, metric: LeaderboardMetric) {
  const activePortfolioId = useActivePortfolioId()

  return useQuery({
    queryKey: ['groups', activePortfolioId, groupId, 'leaderboard', metric],
    queryFn: () => fetchGroupLeaderboard(groupId, metric),
    enabled: Boolean(activePortfolioId && groupId),
  })
}

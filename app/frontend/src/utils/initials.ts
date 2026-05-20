import type { LeaderboardEntry, LeaderboardMetric } from '../types'
import { formatMoney, formatSignedPercent } from './format'

export function getInitials(username: string) {
  const initials = username
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return initials || '?'
}

export function getLeaderboardDisplayValue(entry: LeaderboardEntry, metric: LeaderboardMetric) {
  if (metric === 'seasonal') {
    return entry.seasonGainPercent === null ? 'n/a' : formatSignedPercent(entry.seasonGainPercent)
  }

  return formatMoney(entry.totalValue)
}

import { useGroup, useGroupLeaderboard } from '../../hooks/useGroups'
import GroupDetailHeader from './GroupDetailHeader'
import GroupRankingList from './GroupRankingList'
import GroupStats from './GroupStats'

type GroupDetailContentProps = {
  groupId: string
  onClose: () => void
}

export default function GroupDetailContent({ groupId, onClose }: GroupDetailContentProps) {
  const { data: group, isError: isGroupError, isLoading: isGroupLoading } = useGroup(groupId)
  const { data: leaderboard, isError, isLoading } = useGroupLeaderboard(groupId, 'seasonal')
  const entries = leaderboard?.entries ?? []
  const currentUserEntry = entries.find((entry) => entry.isOwnPortfolio)

  return (
    <>
      <GroupDetailHeader
        group={group}
        isError={isGroupError}
        isLoading={isGroupLoading}
        onClose={onClose}
      />
      <GroupStats
        memberCount={group?.members.length}
        currentRank={currentUserEntry?.rank}
        topGain={entries[0]?.seasonGainPercent}
      />
      <GroupRankingList entries={entries} isError={isError} isLoading={isLoading} />
    </>
  )
}

import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useGroups } from '../../hooks/useGroups'
import type { GroupSummary } from '../../types'
import PageTitle from '../PageTitle'
import GroupDetailsModal from './GroupDetailsModal'
import GroupOverviewCard, { GroupCardSkeleton } from './GroupOverviewCard'
import NewGroupModal from './NewGroupModal'

export default function GroupsOverview() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const { data: groups = [], isError, isLoading } = useGroups()

  return (
    <>
      <div className="flex items-start justify-between gap-16 mb-40">
        <PageTitle title="Trading Groups" />
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="mt-2 flex shrink-0 items-center gap-8 rounded-2xl bg-text px-15 py-2.5 text-small font-bold text-surface transition-opacity hover:opacity-90 hover:cursor-pointer"
        >
          <Plus size={16} strokeWidth={2.2} />
          New Group
        </button>
      </div>
      <div className="mx-auto flex w-full max-w-171.5 flex-col gap-25">
        <GroupList
          groups={groups}
          isError={isError}
          isLoading={isLoading}
          onOpenGroup={setSelectedGroupId}
        />

        <NewGroupModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onGroupSelected={setSelectedGroupId}
        />
        <GroupDetailsModal
          groupId={selectedGroupId}
          isOpen={selectedGroupId !== null}
          onClose={() => setSelectedGroupId(null)}
        />
      </div>
    </>
  )
}

function GroupList({
  groups,
  isError,
  isLoading,
  onOpenGroup,
}: {
  groups: GroupSummary[]
  isError: boolean
  isLoading: boolean
  onOpenGroup: (groupId: string) => void
}) {
  if (isLoading) {
    return (
      <section className="flex flex-col gap-12">
        <GroupCardSkeleton />
        <GroupCardSkeleton />
        <GroupCardSkeleton />
      </section>
    )
  }

  if (isError) {
    return <GroupListMessage>Could not load your groups.</GroupListMessage>
  }

  if (groups.length === 0) {
    return (
      <GroupListMessage>
        You are not in a group yet. Create one or join with a code.
      </GroupListMessage>
    )
  }

  return (
    <section className="flex flex-col gap-12">
      {groups.map((group) => (
        <GroupOverviewCard key={group.id} group={group} onOpen={onOpenGroup} />
      ))}
    </section>
  )
}

function GroupListMessage({ children }: { children: string }) {
  return (
    <section className="rounded-xl border border-border bg-surface px-25 py-25 text-body text-muted">
      {children}
    </section>
  )
}

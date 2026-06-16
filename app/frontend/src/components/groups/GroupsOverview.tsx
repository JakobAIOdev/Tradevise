import { LogIn, Plus } from 'lucide-react'
import { useState } from 'react'
import { useGroups } from '../../hooks/useGroups'
import type { GroupSummary } from '../../types'
import PageTitle from '../PageTitle'
import GroupDetailsModal from './GroupDetailsModal'
import GroupOverviewCard, { GroupCardSkeleton } from './GroupOverviewCard'
import NewGroupModal from './NewGroupModal'
import Button from '../Button'
import type { GroupModalMode } from './NewGroupModal'

export default function GroupsOverview() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<GroupModalMode>('create')
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const { data: groups = [], isError, isLoading } = useGroups()

  function openGroupModal(mode: GroupModalMode) {
    setModalMode(mode)
    setIsModalOpen(true)
  }

  return (
    <>
      <div className="mb-40 flex flex-col gap-16 sm:flex-row sm:items-start sm:justify-between">
        <PageTitle title="Trading Groups" />
        <div className="flex flex-wrap gap-8 sm:mt-2 sm:justify-end">
          <Button
            size="sm"
            variant="secondary"
            leading={<LogIn size={16} strokeWidth={2.2} />}
            onClick={() => openGroupModal('join')}
            className="shrink-0 rounded-2xl py-2.5"
          >
            Join group
          </Button>
          <Button
            size="sm"
            leading={<Plus size={16} strokeWidth={2.2} />}
            onClick={() => openGroupModal('create')}
            className="shrink-0 rounded-2xl py-2.5"
          >
            Create group
          </Button>
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-171.5 flex-col gap-25">
        <GroupList
          groups={groups}
          isError={isError}
          isLoading={isLoading}
          onOpenGroup={setSelectedGroupId}
        />

        <NewGroupModal
          key={modalMode}
          isOpen={isModalOpen}
          initialMode={modalMode}
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

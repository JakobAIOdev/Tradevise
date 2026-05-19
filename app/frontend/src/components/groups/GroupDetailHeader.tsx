import { X } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import type { GroupDetail } from '../../types'
import GroupInviteCode from './GroupInviteCode'

type GroupDetailHeaderProps = {
  group?: GroupDetail
  isError: boolean
  isLoading: boolean
  onClose?: () => void
}

export default function GroupDetailHeader({
  group,
  isError,
  isLoading,
  onClose,
}: GroupDetailHeaderProps) {
  const currentUserId = useAuthStore((state) => state.user?.id)
  const canShareInviteCode =
    Boolean(group && currentUserId) &&
    (group?.ownerId === currentUserId ||
      group?.members.some((member) => member.user.id === currentUserId && member.role === 'OWNER'))

  return (
    <div className="flex items-start justify-between gap-12">
      <div className="min-w-0">
        <h1 className="truncate text-h2 font-bold leading-tight text-text">
          {group?.name ?? 'Trading Group'}
        </h1>
        <div className="mt-2 text-small text-muted">
          {isLoading && 'Loading group...'}
          {isError && 'Could not load this group.'}
        </div>
        {canShareInviteCode && group && <GroupInviteCode code={group.code} />}
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-lg border border-border p-2 text-text transition-colors hover:cursor-pointer hover:bg-surface-hover"
          aria-label="Close group details"
        >
          <X size={20} strokeWidth={1.5} />
        </button>
      )}
    </div>
  )
}

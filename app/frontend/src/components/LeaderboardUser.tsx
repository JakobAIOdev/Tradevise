import { getInitials } from '../utils/initials'

type LeaderboardUserProps = {
  username: string
  isCurrentUser: boolean
  subtitle?: string
}

export default function LeaderboardUser({ username, isCurrentUser, subtitle }: LeaderboardUserProps) {
  return (
    <div className="flex min-w-0 items-center gap-3 overflow-hidden">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface-hover text-small font-bold text-text">
        {getInitials(username)}
      </div>
      <div className="flex min-w-0 items-center gap-2 overflow-hidden">
        <div className="min-w-0">
          <p className="min-w-0 truncate text-body text-text" title={username}>
            {username}
          </p>
          {subtitle && (
            <p className="min-w-0 truncate text-[13px] leading-tight text-muted" title={subtitle}>
              {subtitle}
            </p>
          )}
        </div>
        {isCurrentUser && (
          <span className="shrink-0 rounded-md bg-text px-2 py-1 text-[0.65rem] font-bold leading-none text-surface">
            YOU
          </span>
        )}
      </div>
    </div>
  )
}

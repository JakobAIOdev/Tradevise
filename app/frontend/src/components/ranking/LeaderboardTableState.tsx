type LeaderboardTableStateProps = {
  children?: string
  variant?: 'empty' | 'error'
}

export default function LeaderboardTableState({
  children,
  variant = 'empty',
}: LeaderboardTableStateProps) {
  const message =
    children ?? (variant === 'error' ? 'Could not load leaderboard.' : 'No portfolios yet.')

  return <div className="px-25 py-40 text-center text-body text-muted">{message}</div>
}

export function LeaderboardTableSkeleton() {
  return (
    <div className="flex flex-col">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="min-h-72 border-b border-border bg-surface px-25 py-12 last:border-b-0"
        >
          <div className="h-10 w-full rounded-full bg-surface-hover" />
        </div>
      ))}
    </div>
  )
}

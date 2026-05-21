import { Star } from 'lucide-react'
import Button from '../Button'

type FavoriteButtonProps = {
  isFavorite: boolean
  isPending?: boolean
  onToggle: () => void
}

export default function FavoriteButton({
  isFavorite,
  isPending = false,
  onToggle,
}: FavoriteButtonProps) {
  return (
    <Button
      variant="ghost"
      size="none"
      aria-label={isFavorite ? 'Remove from watchlist' : 'Add to watchlist'}
      aria-pressed={isFavorite}
      disabled={isPending}
      className="rounded-full p-2 text-muted transition-colors hover:text-text disabled:cursor-wait disabled:opacity-60 hover:cursor-pointer"
      onClick={onToggle}
    >
      <Star
        size={25}
        className={isFavorite ? 'fill-[#EECD15] stroke-[#EECD15]' : 'fill-surface stroke-current'}
      />
    </Button>
  )
}

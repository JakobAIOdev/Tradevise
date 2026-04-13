import { PanelLeft } from 'lucide-react'

interface TopbarProps {
  onToggle: () => void
}

export default function Topbar({ onToggle }: TopbarProps) {
  return (
    <div className="flex items-center justify-between w-full h-60 px-25 bg-surface border-b border-border">
      <button onClick={onToggle}>
        <PanelLeft
          size={20}
          strokeWidth={1.5}
          className="text-muted hover:text-text transition-colors"
        />
      </button>
    </div>
  )
}

import { PanelLeft, Sun, Moon, Search } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'

interface TopbarProps {
  onToggle: () => void
}

export default function Topbar({ onToggle }: TopbarProps) {
  const { theme, toggle } = useTheme()

  return (
    <div className="flex items-center justify-between w-full h-60 px-25 bg-surface border-b border-border">
      <button onClick={onToggle}>
        <PanelLeft
          size={20}
          strokeWidth={1.5}
          className="text-muted hover:text-text transition-colors cursor-pointer"
        />
      </button>

      <div className="flex gap-40 pr-80">
        <div className="flex items-center gap-8 px-15 py-8 bg-bg border border-border rounded-xl w-75">
          <Search size={16} strokeWidth={1.5} className="text-muted" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent text-small text-text placeholder:text-muted outline-none w-full"
          />
        </div>

        <button
          onClick={toggle}
          className="bg-surface border border-border rounded-xl p-10 cursor-pointe"
        >
          {theme === 'dark' ? (
            <Moon
              size={20}
              strokeWidth={1.5}
              className="text-muted hover:text-text transition-colors"
            />
          ) : (
            <Sun
              size={20}
              strokeWidth={1.5}
              className="text-muted hover:text-text transition-colors"
            />
          )}
        </button>
      </div>
    </div>
  )
}

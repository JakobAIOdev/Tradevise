import { PanelLeft, Sun, Moon } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'
import { SearchBar } from './discover/SearchBar'

interface TopbarProps {
  onToggle: () => void
}

export default function Topbar({ onToggle }: TopbarProps) {
  const { theme, toggle } = useTheme()

  return (
    <div className="flex items-center justify-between w-full h-60 max-h-60 px-25 bg-surface border-b border-border transition-colors duration-200 ease-out">
      <button onClick={onToggle}>
        <PanelLeft
          size={20}
          strokeWidth={1.5}
          className="text-muted hover:text-text transition-colors cursor-pointer"
        />
      </button>

      <div className="flex flex-1 items-center justify-end gap-40 pr-80">
        <SearchBar className="w-88 max-w-[50vw] flex-none" size="compact" />

        <button
          onClick={toggle}
          className="bg-surface border border-border rounded-xl p-10 cursor-pointer transition-colors duration-200 ease-out"
        >
          {theme === 'dark' ? (
            <Moon
              size={20}
              strokeWidth={1.5}
              className="text-muted hover:text-text transition-colors duration-200 ease-out"
            />
          ) : (
            <Sun
              size={20}
              strokeWidth={1.5}
              className="text-muted hover:text-text transition-colors duration-200 ease-out"
            />
          )}
        </button>
      </div>
    </div>
  )
}

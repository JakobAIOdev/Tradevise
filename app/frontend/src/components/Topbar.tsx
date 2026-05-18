import { PanelLeft, Sun, Moon } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'
import { SearchBar } from './discover/SearchBar'

interface TopbarProps {
  onToggle: () => void
}

export default function Topbar({ onToggle }: TopbarProps) {
  const { theme, toggle } = useTheme()

  return (
    <div className="flex h-60 max-h-60 w-full items-center gap-6 border-b border-border bg-surface px-12 transition-colors duration-200 ease-out md:gap-25 md:pl-25 md:pr-80">
      <button type="button" aria-label="Toggle navigation" onClick={onToggle} className="shrink-0">
        <PanelLeft
          size={20}
          strokeWidth={1.5}
          className="text-muted hover:text-text transition-colors cursor-pointer"
        />
      </button>

      <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-6 md:gap-12">
        <div className="min-w-[15rem] max-w-72 sm:max-w-80 md:max-w-88">
          <SearchBar className="w-full min-w-0" size="compact" />
        </div>

        <button
          onClick={toggle}
          className="shrink-0 bg-surface border border-border rounded-xl p-8 cursor-pointer transition-colors duration-200 ease-out md:p-10"
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

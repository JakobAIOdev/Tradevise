import { PanelLeft, Sun, Moon } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'
import { SearchBar } from './discover/SearchBar'

interface TopbarProps {
  onToggle: () => void
}

export default function Topbar({ onToggle }: TopbarProps) {
  const { theme, toggle } = useTheme()

  return (
    <div className="flex h-60 max-h-60 w-full items-center justify-between border-b border-border bg-surface pl-12 pr-12 transition-colors duration-200 ease-out md:pl-25 md:pr-80">
      <button type="button" aria-label="Toggle navigation" onClick={onToggle}>
        <PanelLeft
          size={20}
          strokeWidth={1.5}
          className="text-muted hover:text-text transition-colors cursor-pointer"
        />
      </button>

      <div className="flex flex-1 items-center justify-end gap-8 md:gap-40">
        <SearchBar
          className="ml-8 w-52 max-w-[calc(100vw-8rem)] flex-none md:ml-0 md:w-88 md:max-w-[50vw]"
          size="compact"
        />

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

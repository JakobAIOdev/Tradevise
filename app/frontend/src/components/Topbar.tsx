import { PanelLeft, Sun, Moon } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'
import Button from './Button'
import { SearchBar } from './discover/SearchBar'

interface TopbarProps {
  onToggle: () => void
}

const darkmodeToggleStyles = `text-muted hover:text-text transition-colors duration-200 ease-out`

export default function Topbar({ onToggle }: TopbarProps) {
  const { theme, toggle } = useTheme()

  return (
    <div className="flex h-60 max-h-60 w-full items-center gap-6 border-b border-border bg-surface px-12 transition-colors duration-200 ease-out md:gap-25 md:pl-25 md:pr-80">
      <Button
        variant="ghost"
        size="none"
        aria-label="Toggle navigation"
        onClick={onToggle}
        className="shrink-0 hover:bg-transparent"
      >
        <PanelLeft
          size={20}
          strokeWidth={1.5}
          className="text-muted hover:text-text transition-colors cursor-pointer"
        />
      </Button>

      <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-6 md:gap-12">
        <div className="min-w-[15rem] max-w-72 sm:max-w-80 md:max-w-88">
          <SearchBar className="w-full min-w-0" size="compact" />
        </div>

        <Button
          variant="secondary"
          size="none"
          onClick={toggle}
          className="shrink-0 rounded-xl p-8 transition-colors duration-200 ease-out md:p-10"
        >
          {theme === 'dark' ? (
            <Moon size={20} strokeWidth={1.5} className={darkmodeToggleStyles} />
          ) : (
            <Sun size={20} strokeWidth={1.5} className={darkmodeToggleStyles} />
          )}
        </Button>
      </div>
    </div>
  )
}

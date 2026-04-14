import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStockSearch } from '../../hooks/useStockSearch'
import type { StockSuggestion } from '../../Types'
import { LoaderCircle, Search, X } from 'lucide-react'

type SearchBarProps = {
  className?: string
  size?: 'default' | 'compact'
}

type SearchResultLogoProps = {
  logoUrl: string | null
  symbol: string
}

function SearchResultLogo({ logoUrl, symbol }: SearchResultLogoProps) {
  const [hasError, setHasError] = useState(false)

  if (!logoUrl || hasError) {
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-surface-hover text-xs font-semibold text-text">
        {symbol.charAt(0)}
      </span>
    )
  }

  return (
    <img
      src={logoUrl}
      alt=""
      width={28}
      height={28}
      className="h-7 w-7 rounded-full object-contain"
      onError={() => setHasError(true)}
    />
  )
}

export function SearchBar({ className = '', size = 'default' }: SearchBarProps) {
  const [input, setInput] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const { data: results = [], isError, isLoading, isFetching } = useStockSearch(input)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = useCallback(
    (symbol: string) => {
      navigate(`/detail/${encodeURIComponent(symbol)}`)
      setInput('')
      setIsOpen(false)
      setActiveIndex(-1)
    },
    [navigate],
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      handleSelect(results[activeIndex].symbol)
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  const showDropdown = isOpen && input.length > 0
  const isCompact = size === 'compact'

  return (
    <div ref={containerRef} className={`relative z-20 min-w-0 ${className}`}>
      <div
        className={`
        flex items-center gap-8 rounded-xl border bg-surface
        transition-[background-color,border-color] duration-200 ease-out
        ${isCompact ? 'h-40 px-12 py-8' : 'h-13.75 px-15 py-8'}
        ${isOpen ? 'border-text' : 'border-border'}
      `}
      >
        <Search size={isCompact ? 16 : 20} strokeWidth={1.5} className="shrink-0 text-muted" />

        <input
          type="text"
          value={input}
          placeholder="Search Stocks or Crypto..."
          onChange={(e) => {
            setInput(e.target.value)
            setActiveIndex(-1)
            setIsOpen(true)
          }}
          onFocus={() => {
            if (input.length > 0) setIsOpen(true)
          }}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          spellCheck={false}
          aria-label="Search Stocks"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
          className="
            flex-1 bg-transparent border-none outline-none
            text-small text-text placeholder:text-muted
          "
        />

        <div
          className={`flex shrink-0 items-center justify-center ${isCompact ? 'h-4 w-4' : 'h-5 w-5'}`}
        >
          {isFetching ? (
            <LoaderCircle
              size={isCompact ? 16 : 20}
              strokeWidth={1.5}
              className="animate-spin text-muted [animation-duration:900ms] motion-reduce:animate-none"
            />
          ) : input.length > 0 ? (
            <button
              type="button"
              onClick={() => {
                setInput('')
                setIsOpen(false)
                setActiveIndex(-1)
              }}
              className={`flex cursor-pointer items-center justify-center text-muted transition-colors duration-200 hover:text-text ${isCompact ? 'h-4 w-4' : 'h-5 w-5'}`}
            >
              <X size={isCompact ? 16 : 20} strokeWidth={1.5} aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>

      {showDropdown && (
        <ul
          role="listbox"
          className="mt-8 max-h-[320px] w-full overflow-y-auto rounded-xl border border-border bg-surface p-8 m-0 list-none transition-[background-color,border-color] duration-200 ease-out absolute"
        >
          {isError ? (
            <li className="px-15 py-15 text-center text-small text-muted">Search not available.</li>
          ) : isLoading || (isFetching && results.length === 0) ? (
            <li className="px-15 py-15 text-center text-small text-muted">Searching...</li>
          ) : results.length > 0 ? (
            results.map((r: StockSuggestion, i: number) => (
              <li
                key={r.symbol}
                role="option"
                aria-selected={i === activeIndex}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseDown={(e) => {
                  e.preventDefault()
                  handleSelect(r.symbol)
                }}
                className={`flex min-h-48 cursor-pointer items-center gap-10 rounded-lg px-10 py-8 transition-colors duration-100
                  ${i === activeIndex ? 'bg-surface-hover' : 'hover:bg-surface-hover'}
                `}
              >
                <div className="w-7 h-7 shrink-0 flex items-center justify-center">
                  <SearchResultLogo logoUrl={r.logoUrl} symbol={r.symbol} />
                </div>

                <div className="flex min-w-0 flex-1 flex-col overflow-hidden gap-px">
                  <span className="truncate text-small font-semibold text-text">{r.name}</span>
                  <span className="text-xs text-muted">{r.symbol}</span>
                </div>

                <span className="shrink-0 rounded border border-border bg-surface-hover px-1.5 py-0.5 text-[11px] text-muted">
                  {r.type}
                </span>
              </li>
            ))
          ) : (
            <li className="px-15 py-15 text-center text-small text-muted">
              No result for „{input}“
            </li>
          )}
        </ul>
      )}
    </div>
  )
}

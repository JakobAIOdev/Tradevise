import { Info } from 'lucide-react'
import { useId } from 'react'

type InfoTooltipProps = {
  text: string
  align?: 'left' | 'right'
}

export default function InfoTooltip({ text, align = 'left' }: InfoTooltipProps) {
  const tooltipId = useId()
  const alignmentClass =
    align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left'

  return (
    <span className="relative inline-flex shrink-0 align-middle">
      <span
        aria-describedby={tooltipId}
        aria-label={text}
        className="group inline-flex h-5 w-5 cursor-help items-center justify-center rounded-full text-muted outline-none transition-colors hover:text-text focus-visible:text-text focus-visible:ring-2 focus-visible:ring-border"
        tabIndex={0}
      >
        <Info size={14} strokeWidth={1.8} aria-hidden="true" />
        <span
          id={tooltipId}
          role="tooltip"
          className={`pointer-events-none absolute top-full z-30 mt-2 w-56 scale-95 rounded-lg border border-border bg-surface px-3 py-2 text-left text-xs leading-snug text-text opacity-0 shadow-lg transition duration-150 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100 ${alignmentClass}`}
        >
          {text}
        </span>
      </span>
    </span>
  )
}

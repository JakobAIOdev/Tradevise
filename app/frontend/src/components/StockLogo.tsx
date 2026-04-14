import { useState } from 'react'

interface StockLogoProps {
  src: string
  ticker: string
}

export default function StockLogo({ src, ticker }: StockLogoProps) {
  const [error, setError] = useState(false)

  if (error) {
    return (
      <div className="w-48 h-48 rounded-xl bg-surface-hover border border-border flex items-center justify-center shrink-0">
        <span className="text-small font-bold text-muted">{ticker.charAt(0)}</span>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={ticker}
      onError={() => setError(true)}
      className="w-48 h-48 rounded-xl object-contain shrink-0"
    />
  )
}

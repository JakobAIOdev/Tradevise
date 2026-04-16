import { useState } from 'react'

interface StockLogoProps {
  src: string
  ticker: string
  size?: number
}

export default function StockLogo({ src, ticker, size = 48 }: StockLogoProps) {
  const [error, setError] = useState(false)

  if (error || !src) {
    return (
      <div
        style={{ width: size, height: size }}
        className="rounded-xl bg-surface-hover border border-border flex items-center justify-center shrink-0"
      >
        <span className="text-small font-bold text-muted">{ticker.charAt(0)}</span>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={ticker}
      onError={() => setError(true)}
      style={{ width: size, height: size }}
      className="rounded-xl object-contain shrink-0"
    />
  )
}

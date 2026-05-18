import type { Stock } from '../../types'
import StockLogo from '../StockLogo'
import { ChevronDown, ChevronUp, LoaderCircle } from 'lucide-react'

export default function DetailHeader({
  name,
  ticker,
  change,
  logo,
  price,
  changeValue,
  positiveChange,
}: Stock) {
  const positive = positiveChange ?? change >= 0
  const hasPrice = typeof price === 'number' && price > 0

  return (
    <div className="pt-25">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_19.6875rem]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-6">
            <StockLogo src={logo} ticker={ticker} size={72} />
            <div>
              <h2 className="text-h2 text-text">{name}</h2>
              <h3 className="text-h3 text-muted">{ticker}</h3>
            </div>
          </div>

          <div className="text-left lg:text-right">
            <span className="flex min-h-10 items-center justify-start text-h2 text-text lg:justify-end">
              {hasPrice ? (
                `${price.toFixed(2)} €`
              ) : (
                <LoaderCircle
                  size={28}
                  strokeWidth={1.5}
                  className="animate-spin text-muted [animation-duration:900ms] motion-reduce:animate-none"
                />
              )}
            </span>
            <div className="flex flex-row gap-5 lg:justify-end">
              <span className={positive ? 'text-bullish text-body' : 'text-bearish text-body'}>
                {positive ? '+ ' : '- '}
                {typeof changeValue === 'number' ? Math.abs(changeValue).toFixed(2) : '0.00'} €
              </span>
              <span
                className={`flex items-center gap-0.5 text-body ${positive ? 'text-bullish' : 'text-bearish'}`}
              >
                (
                {positive ? (
                  <ChevronUp size={16} strokeWidth={2.5} />
                ) : (
                  <ChevronDown size={16} strokeWidth={2.5} />
                )}
                {Math.abs(change).toFixed(2)} % )
              </span>
            </div>
          </div>
        </div>
        <div />
      </div>
    </div>
  )
}

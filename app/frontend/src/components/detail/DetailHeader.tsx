import type { Stock } from '../../Types'
import StockLogo from '../StockLogo'
import { ChevronDown, ChevronUp } from 'lucide-react'

export default function DetailHeader({
  name,
  ticker,
  change,
  logo,
  price,
  changeValue,
  positiveChange,
}: Stock) {
  return (
    <div className="pt-25">
      <div className="grid grid-cols-[minmax(0,1fr)_19.6875rem] gap-6">
        <div className="flex items-center justify-between">
          <div className="flex gap-6 items-center">
            <StockLogo src={logo} ticker={ticker} size={72} />
            <div>
              <h2 className="text-h2 text-text">{name}</h2>
              <h3 className="text-h3 text-muted">{ticker}</h3>
            </div>
          </div>

          <div className="text-right">
            <span className="text-h2 text-text">{price} €</span>
            <div className="flex flex-row gap-5 justify-end">
              <span
                className={positiveChange ? 'text-bullish text-body' : 'text-bearish text-body'}
              >
                {positiveChange ? '+ ' : '- '}
                {changeValue} €
              </span>
              <span
                className={`flex items-center gap-0.5 text-body ${positiveChange ? 'text-bullish' : 'text-bearish'}`}
              >
                (
                {positiveChange ? (
                  <ChevronUp size={16} strokeWidth={2.5} />
                ) : (
                  <ChevronDown size={16} strokeWidth={2.5} />
                )}
                {change} % )
              </span>
            </div>
          </div>
        </div>
        <div />
      </div>
    </div>
  )
}

import { formatMoney, formatSignedMoney, formatSignedPercent } from '../../../utils/format'

type PortfolioSummaryProps = {
  portfolioValue: number
  cash: number
  todayChange: number
  todayChangePercent: number
}

export default function PortfolioSummary({
  portfolioValue,
  cash,
  todayChange,
  todayChangePercent,
}: PortfolioSummaryProps) {
  const changeTone = todayChange >= 0 ? 'text-bullish' : 'text-bearish'

  return (
    <>
      <div>
        <p className="text-body text-text">Portfolio Value</p>
        <div className="mt-8 flex flex-wrap items-baseline gap-x-12 gap-y-4">
          <p className="text-h1-mobile leading-none text-text md:text-h1">
            {formatMoney(portfolioValue)}
          </p>
          <p className="text-body text-muted">+ {formatMoney(cash)} cash</p>
        </div>
        <p className={`mt-18 text-body ${changeTone}`}>
          {formatSignedMoney(todayChange)} ({formatSignedPercent(todayChangePercent)})
        </p>
      </div>
    </>
  )
}

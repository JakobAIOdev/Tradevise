import type { PortfolioTableRow } from './TableColumns'
import AllocationChart from './overview/AllocationChart'
import AllocationLegend from './overview/AllocationLegend'
import PortfolioActions from './overview/PortfolioActions'
import PortfolioSummary from './overview/PortfolioSummary'
import { buildAllocation } from '../../utils/portfolio-allocation'

type PortfolioOverviewProps = {
  rows: PortfolioTableRow[]
  cash: number
  todayChange: number
  todayChangePercent: number
}

export default function PortfolioOverview({
  rows,
  cash,
  todayChange,
  todayChangePercent,
}: PortfolioOverviewProps) {
  const investedValue = rows.reduce((sum, row) => sum + row.marketValue, 0)
  const allocation = buildAllocation(rows, investedValue)

  return (
    <section className="grid gap-25 rounded-2xl border border-border bg-surface p-25 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="order-1 min-w-0 lg:col-start-1 lg:row-start-1">
        <PortfolioSummary
          portfolioValue={investedValue}
          cash={cash}
          todayChange={todayChange}
          todayChangePercent={todayChangePercent}
        />
      </div>

      <div className="order-2 lg:col-start-2 lg:row-span-3 lg:row-start-1">
        <AllocationChart allocation={allocation} />
      </div>

      <div className="order-3 border-t border-border pt-18 lg:col-start-1 lg:row-start-3">
        <AllocationLegend allocation={allocation} />
      </div>

      <div className="order-4 lg:col-start-1 lg:row-start-2">
        <PortfolioActions />
      </div>
    </section>
  )
}

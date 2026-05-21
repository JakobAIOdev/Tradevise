import PageTitle from '../components/PageTitle'
import HoldingsTable from '../components/portfolio/HoldingsTable'
import PortfolioOverview from '../components/portfolio/PortfolioOverview'
import type { PortfolioTableRow } from '../components/portfolio/TableColumns'
import { usePortfolio } from '../hooks/usePortfolio'
import { useStockMetadata } from '../hooks/useStockMetadata'

export default function PortfolioPage() {
  const { data: portfolio } = usePortfolio()
  const holdings = portfolio?.holdings ?? []
  const assetsBySymbol = useStockMetadata(holdings.map((holding) => holding.symbol))

  const rows: PortfolioTableRow[] = holdings.map((holding) => {
    const costBasis = holding.quantity * holding.averagePrice
    const totalPlPercent = costBasis > 0 ? (holding.profitLoss / costBasis) * 100 : 0
    const todayBaseline =
      holding.previousClose && holding.previousClose > 0
        ? holding.quantity * holding.previousClose
        : null

    return {
      ...holding,
      displayName: assetsBySymbol.get(holding.symbol)?.name ?? holding.symbol,
      logoUrl: assetsBySymbol.get(holding.symbol)?.logoUrl ?? null,
      todayChangePercent: todayBaseline ? (holding.todayChange / todayBaseline) * 100 : null,
      totalPlPercent,
    }
  })

  return (
    <div className="flex flex-col gap-25">
      <PageTitle title="Portfolio" />
      <PortfolioOverview
        rows={rows}
        cash={portfolio?.cash ?? 0}
        todayChange={portfolio?.todayChange ?? 0}
        todayChangePercent={portfolio?.todayChangePercent ?? 0}
      />
      <HoldingsTable data={rows} />
    </div>
  )
}

import { useQueries } from '@tanstack/react-query'
import PageTitle from '../components/PageTitle'
import HoldingsTable from '../components/portfolio/HoldingsTable'
import type { PortfolioTableRow } from '../components/portfolio/TableColumns'
import type { StockStatistics } from '../Types'
import { usePortfolio } from '../hooks/usePortfolio'
import { buildApiUrl, protectedFetch } from '../lib/api'

function buildLogoUrl(symbol: string) {
  return `https://api.elbstream.com/logos/isin/${encodeURIComponent(symbol)}`
}

async function fetchStockStatistics(symbol: string): Promise<StockStatistics> {
  const res = await protectedFetch(buildApiUrl(`/stocks/${encodeURIComponent(symbol)}/statistics`))

  if (!res.ok) {
    throw new Error(`Statistics request failed with status ${res.status}`)
  }

  return (await res.json()) as StockStatistics
}

export default function PortfolioPage() {
  const { data: portfolio } = usePortfolio()
  const holdings = portfolio?.holdings ?? []
  const statisticsQueries = useQueries({
    queries: holdings.map((holding) => ({
      queryKey: ['stock-statistics', holding.symbol],
      queryFn: () => fetchStockStatistics(holding.symbol),
      staleTime: 1000 * 60 * 5,
    })),
  })

  const stockNamesBySymbol = new Map(
    holdings.map((holding, index) => [
      holding.symbol,
      statisticsQueries[index]?.data?.name?.trim() || holding.symbol,
    ]),
  )

  const rows: PortfolioTableRow[] = holdings.map((holding) => {
    const costBasis = holding.quantity * holding.averagePrice
    const totalPlPercent = costBasis > 0 ? (holding.profitLoss / costBasis) * 100 : 0
    const todayBaseline =
      holding.previousClose && holding.previousClose > 0
        ? holding.quantity * holding.previousClose
        : null

    return {
      ...holding,
      displayName: stockNamesBySymbol.get(holding.symbol) ?? holding.symbol,
      logoUrl: buildLogoUrl(holding.symbol),
      todayChangePercent: todayBaseline ? (holding.todayChange / todayBaseline) * 100 : null,
      totalPlPercent,
    }
  })

  return (
    <>
      <PageTitle title="Portfolio" />
      <HoldingsTable data={rows} />
    </>
  )
}

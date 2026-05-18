import type { PortfolioTableRow } from '../components/portfolio/TableColumns'

export type AllocationSlice = {
  symbol: string
  name: string
  value: number
  percent: number
  color: string
}

const CHART_COLORS = [
  '#0f9dcc',
  '#9bc9e8',
  '#ff7a45',
  '#ffa10a',
  '#8f3a05',
  '#536dfe',
  '#13b981',
  '#e24aa3',
]

function getSliceColor(index: number, total: number) {
  if (index < CHART_COLORS.length) {
    return CHART_COLORS[index]
  }

  const hue = Math.round((index * 360) / Math.max(total, 1))
  return `hsl(${hue} 74% 46%)`
}

export function buildAllocation(rows: PortfolioTableRow[], investedValue: number) {
  return [...rows]
    .sort((a, b) => b.marketValue - a.marketValue)
    .filter((row) => row.marketValue > 0)
    .map((row, index) => ({
      symbol: row.symbol,
      name: row.displayName,
      value: row.marketValue,
      percent: investedValue > 0 ? (row.marketValue / investedValue) * 100 : 0,
      color: getSliceColor(index, rows.length),
    }))
}

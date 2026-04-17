import type { Stock } from '../../Types'
import StockCard from './StockCard'
import { TrendingUp } from 'lucide-react'

interface StockGridProps {
  title: string
  stocks: Stock[]
  interactive?: boolean
}

export default function StockGrid({ title, stocks, interactive = true }: StockGridProps) {
  return (
    <section className="flex flex-col gap-40">
      <h2 className="text-h2 text-text flex items-center gap-8">
        <TrendingUp size={34} strokeWidth={1.5} />
        {title}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-15">
        {stocks.map((stock) => (
          <StockCard key={stock.ticker} {...stock} interactive={interactive} />
        ))}
      </div>
    </section>
  )
}

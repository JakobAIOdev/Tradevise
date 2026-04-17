import { ExternalLink, Star } from 'lucide-react'
import BackLink from '../components/BackLink'
import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import DetailHeader from '../components/detail/DetailHeader'
import KeyStatistics from '../components/detail/KeyStatistics'
import ActionButton from '../components/detail/ActionButton'
import PositionSummary from '../components/detail/PositionSummary'
import StockChart from '../components/chart/StockChart'
import { useLocation, useParams } from 'react-router-dom'
import { useStockLivePrice } from '../hooks/useStockLivePrice'
import { useStockStatistics } from '../hooks/useStockStatistics'
import { useStockChart } from '../hooks/useStockChart'
import { usePortfolio } from '../hooks/usePortfolio'
import type { Stock } from '../types'
import { useModalStore } from '../stores/useModalStore'
import type { ChartRange } from '../types/chart'

type StockDetailLocationState = {
  stock?: Stock
}

function getRangePerformance(stock: Stock, prices: number[] | undefined): Stock {
  const firstPrice = prices?.[0]
  const lastPrice = prices && prices.length > 0 ? prices[prices.length - 1] : undefined

  if (
    typeof firstPrice !== 'number' ||
    typeof lastPrice !== 'number' ||
    firstPrice <= 0 ||
    lastPrice <= 0
  ) {
    return stock
  }

  const changeValue = lastPrice - firstPrice
  const change = (changeValue / firstPrice) * 100

  return {
    ...stock,
    price: lastPrice,
    change,
    changeValue,
    positiveChange: changeValue >= 0,
  }
}

export default function StockDetailPage() {
  const { ticker = '' } = useParams()
  const { open } = useModalStore()
  const location = useLocation()
  const queryClient = useQueryClient()
  const [isFavorite, setIsFavorite] = useState(false)
  const [range, setRange] = useState<ChartRange>('intraday')
  useStockLivePrice(ticker)

  const { data: statistics, isFetching: statisticsFetching } = useStockStatistics(ticker)
  const { data: portfolio, isFetching: portfolioFetching } = usePortfolio()
  const { data: chart } = useStockChart(ticker, range)

  const holding = portfolio?.holdings.find((item) => item.symbol === ticker)
  const stateStock = (location.state as StockDetailLocationState | null)?.stock
  const discoverStock = queryClient
    .getQueryData<Stock[]>(['discover-stocks'])
    ?.find((stock) => stock.ticker === ticker)
  const fallbackStock: Stock = {
    name: ticker,
    ticker,
    change: 0,
    logo: '',
    positiveChange: true,
  }
  const initialStock = stateStock ?? discoverStock ?? fallbackStock

  const { data: stock = initialStock } = useQuery({
    queryKey: ['stock-detail', ticker],
    queryFn: async () => queryClient.getQueryData<Stock>(['stock-detail', ticker]) ?? initialStock,
    initialData: () => queryClient.getQueryData<Stock>(['stock-detail', ticker]) ?? initialStock,
    enabled: false,
    staleTime: Infinity,
  })

  const displayStock = getRangePerformance(
    stock,
    chart?.points.map((point) => point.price),
  )

  useEffect(() => {
    const previousTitle = document.title
    document.title = `Tradevise | ${stock.name}`

    return () => {
      document.title = previousTitle
    }
  }, [stock.name, stock.ticker])

  return (
    <div className="max-w-300">
      <div className="flex justify-between items-center mb-6">
        <BackLink />
        <Star
          size={25}
          className={`cursor-pointer ${isFavorite ? 'fill-[#EECD15] stroke-[#EECD15]' : 'fill-surface stroke-muted'}`}
          onClick={() => setIsFavorite(!isFavorite)}
        />
      </div>
      <DetailHeader {...displayStock} />
      <div className="grid grid-cols-[minmax(0,1fr)_19.6875rem] gap-6 mt-6">
        <div className="flex-1 h-111.5 bg-red-400 rounded-xl">
          <StockChart ticker={ticker} range={range} onRangeChange={setRange} data={chart} />
        </div>
        <div className="flex flex-col">
          <KeyStatistics statistics={statistics} isLoading={statisticsFetching} />
          <div className="flex w-full gap-3 pt-4">
            <ActionButton
              label="Buy"
              action={() => open('buy', { symbol: ticker, price: stock.price })}
            />
            <ActionButton
              label="Sell"
              disabled={!holding}
              action={() => open('sell', { symbol: ticker, price: stock.price })}
            />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-6 mt-6">
        <PositionSummary holding={holding} isLoading={portfolioFetching && !portfolio} />
        <div className="bg-surface h-45 border border-border rounded-xl px-25 pt-5">
          <div className="flex justify-between">
            <p className="text-text text-body">About {stock.name}</p>
            <ExternalLink size={20} strokeWidth={1.5} className="text-muted" />
          </div>
          <p className="text-muted text-small mt-6">
            {stock.name} {stock.ticker}.
          </p>
        </div>
      </div>
    </div>
  )
}

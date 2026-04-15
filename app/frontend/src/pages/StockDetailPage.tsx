import { ExternalLink, Star } from 'lucide-react'
import BackLink from '../components/BackLink'
import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import DetailHeader from '../components/detail/DetailHeader'
import KeyStatistics from '../components/detail/KeyStatistics'
import ActionButton from '../components/detail/ActionButton'
import StockChart from '../components/chart/StockChart'
import { useLocation, useParams } from 'react-router-dom'
import { useTradeStock } from '../hooks/useTradeStock'
import { useStockLivePrice } from '../hooks/useStockLivePrice'
import { useStockStatistics } from '../hooks/useStockStatistics'
import type { Stock } from '../Types'

type StockDetailLocationState = {
  stock?: Stock
}

export default function StockDetailPage() {
  const { ticker = '' } = useParams()
  const location = useLocation()
  const queryClient = useQueryClient()
  const [isFavorite, setIsFavorite] = useState(false)
  const [tradeError, setTradeError] = useState<string | null>(null)
  const [tradeSuccess, setTradeSuccess] = useState<string | null>(null)
  useStockLivePrice(ticker)

  const buyStock = useTradeStock('buy')
  const sellStock = useTradeStock('sell')
  const { data: statistics, isFetching: statisticsFetching } = useStockStatistics(ticker)

  const parsedQuantity = Number(1)
  const tradePending = buyStock.isPending || sellStock.isPending
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
    initialData: () => queryClient.getQueryData<Stock>(['stock-detail', ticker]) ?? initialStock,
    enabled: false,
    staleTime: Infinity,
  })

  useEffect(() => {
    const previousTitle = document.title
    document.title = `Tradevise | ${stock.ticker}`

    return () => {
      document.title = previousTitle
    }
  }, [stock.name, stock.ticker])

  function handleTrade(type: 'buy' | 'sell') {
    setTradeError(null)
    setTradeSuccess(null)

    if (!ticker) {
      setTradeError('No stock selected')
      return
    }

    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      setTradeError('Quantity must be greater that 0')
      return
    }

    const mutation = type === 'buy' ? buyStock : sellStock
    mutation.mutate(
      {
        symbol: ticker,
        quantity: parsedQuantity,
      },
      {
        onSuccess: () => {
          setTradeSuccess(type === 'buy' ? 'Bought successfully' : 'Sold successfully')
        },
        onError: (error) => {
          setTradeError(error instanceof Error ? error.message : 'Transaction failed')
        },
      },
    )
  }

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
      <DetailHeader {...stock} />
      <div className="grid grid-cols-[minmax(0,1fr)_19.6875rem] gap-6 mt-6">
        <div className="flex-1 h-111.5 bg-red-400 rounded-xl">
          <StockChart ticker={ticker} />
        </div>
        <div className="flex flex-col">
          <KeyStatistics
            statistics={statistics}
            isLoading={statisticsFetching || statistics?.status === 'BOOTSTRAPPING'}
          />
          <div className="flex w-full gap-3 pt-4">
            <ActionButton label="Buy" disabled={tradePending} action={() => handleTrade('buy')} />
            <ActionButton label="Sell" disabled={tradePending} action={() => handleTrade('sell')} />
          </div>
          {tradePending && <p className="text-small text-muted">Processing trade...</p>}
          {tradeError && <p className="text-small text-bearish">{tradeError}</p>}
          {tradeSuccess && <p className="text-small text-bullish">{tradeSuccess}</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-6 mt-6">
        <div className="bg-surface h-40.5 border border-border rounded-xl px-25 pt-5">
          <p className="text-text text-body">Your Position</p>
        </div>
        <div className="bg-surface h-40.5 border border-border rounded-xl px-25 pt-5">
          <div className="flex justify-between">
            <p className="text-text text-body">About {stock.name}</p>
            <ExternalLink size={20} strokeWidth={1.5} className="text-muted" />
          </div>
          <p className="text-muted text-small">
            {stock.name} {stock.ticker}.
          </p>
        </div>
      </div>
    </div>
  )
}

import { ExternalLink, Star } from 'lucide-react'
import BackLink from '../components/BackLink'
import { useState } from 'react'
import DetailHeader from '../components/detail/DetailHeader'
import KeyStatistics from '../components/detail/KeyStatistics'
import ActionButton from '../components/detail/ActionButton'

const stock = {
  name: 'Apple Inc.',
  ticker: 'AAPL',
  change: 1.23,
  logo: 'https://s.yimg.com/lb/brands/150x150_apple.png',
  price: 222.22,
  changeValue: 2.35,
  positiveChange: true,
}

export default function StockDetailPage() {
  const [isFavorite, setIsFavorite] = useState(false)

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
        <div className="flex-1 h-111.5 bg-red-400 rounded-xl" />
        <div className="flex flex-col">
          <KeyStatistics />
          <div className="flex w-full gap-3 pt-4">
            <ActionButton label="Buy" action={() => console.log('buy')} />
            <ActionButton label="Sell" action={() => console.log('sell')} />
          </div>
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
            Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets,
            wearables, and accessories worldwide. The company offers iPhone, a line of smartphones;
            Mac, a line of personal computers; iPad, a line of multi-purpose tablets; and wearables,
            home, and accessories comprising
          </p>
        </div>
      </div>
    </div>
  )
}

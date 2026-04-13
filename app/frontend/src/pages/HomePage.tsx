import StatCard from '../components/StatCard'
import { Wallet, TrendingUp, BarChart2 } from 'lucide-react'
import { getTrend } from '../utils/trend'

const todayChange = 97.04
const totalValue = 9524.64
const percentage = (todayChange / totalValue) * 100

export default function HomePage() {
  return (
    <>
      <div>HomePage</div>
      <div className="flex gap-25">
        <StatCard
          icon={TrendingUp}
          label="Today"
          value={`${todayChange > 0 ? '+' : ''} ${todayChange.toFixed(2)} €`}
          valueTrend={getTrend(todayChange)}
          sub={`${todayChange > 0 ? '+' : ''} ${percentage.toFixed(2)} %`}
          subTrend={getTrend(todayChange)}
        />
        <StatCard
          icon={Wallet}
          label="Total Portfolio"
          value="9.524,64 €"
          valueTrend="neutral"
          sub="+ 2.524,64 €"
          subTrend="positive"
        />
        <StatCard
          icon={BarChart2}
          label="Cash left"
          value="1.836,15 €"
          valueTrend="neutral"
          sub="Available"
          subTrend="neutral"
        />
      </div>
    </>
  )
}

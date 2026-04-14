import {
  LineChart,
  CartesianGrid,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { useState } from 'react'
import { CustomTooltip } from './CustomTooltip'
import { formatDate, formatPrice } from '../../utils/chart-helper'
import { useStockChart, type ChartRange } from '../../hooks/useStockChart'

interface StockChartProps {
  ticker: string
  initialRange?: ChartRange
}

const StockChart = ({ ticker, initialRange = '1D' }: StockChartProps) => {
  const [range, setRange] = useState<ChartRange>(initialRange)

  const { data, isPending } = useStockChart(ticker, range)

  if (isPending) return <p>LOADING</p>

  return (
    <div className="p-25 w-full h-full bg-surface border border-border rounded-xl">
      <div className="flex gap-8">
        {(['1D', '1W', '1M', '1Y', 'ALL'] as ChartRange[]).map((r) => (
          <button key={r} onClick={() => setRange(r)}>
            {r}
          </button>
        ))}
      </div>
      <ResponsiveContainer width="100%" height="100%" className="pb-25">
        <LineChart data={data?.points}>
          <CartesianGrid
            vertical={false}
            className="stroke-sparkline opacity-30"
            strokeDasharray="0"
          />

          <XAxis
            type="number"
            dataKey="time"
            scale="time"
            domain={['dataMin', 'dataMax']}
            axisLine={false}
            tickLine={false}
            minTickGap={24}
            tick={{
              fill: 'var(--color-text)',
              fontSize: 13,
              fontWeight: 400,
            }}
            dy={16}
            tickFormatter={(value) => formatDate(value, range)}
          />

          <YAxis
            type="number"
            orientation="right"
            dataKey="price"
            axisLine={false}
            tickLine={false}
            tickCount={8}
            width={72}
            dx={10}
            tick={{
              fill: 'var(--color-text)',
              fontSize: 13,
              fontWeight: 400,
            }}
            tickFormatter={(value) => formatPrice(value)}
            domain={([dataMin, dataMax]: readonly [number, number]) => {
              if (dataMin === dataMax) {
                const padding = dataMin === 0 ? 1 : Math.abs(dataMin) * 0.02
                return [dataMin - padding, dataMax + padding]
              }

              const range = dataMax - dataMin
              const padding = range * 0.12

              return [dataMin - padding, dataMax + padding]
            }}
          />

          <Line
            type="monotone"
            dataKey="price"
            stroke="var(--color-bullish)"
            strokeWidth={3}
            dot={false}
            activeDot={false}
          />
          <Tooltip
            content={(props) => <CustomTooltip {...props} range={range} />}
            animationDuration={50}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default StockChart

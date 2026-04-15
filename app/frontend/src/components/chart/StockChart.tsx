import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  ReferenceLine,
} from 'recharts'
import { useState } from 'react'
import { CustomTooltip } from './CustomTooltip'
import { formatDate, formatPrice, getIntradayAxisConfig } from '../../utils/chart-helper'
import { useStockChart, type ChartRange } from '../../hooks/useStockChart'
import ChartFilter from './ChartFilter'

interface StockChartProps {
  ticker: string
  initialRange?: ChartRange
}

const MIN_GRID_STEPS_PER_SIDE = 2
const PRICE_AXIS_PADDING_MULTIPLIER = 1.06
const MIN_PRICE_AXIS_DISTANCE = 0.05
const AXIS_TICK_STYLE = {
  fill: 'var(--color-text)',
  fontSize: 13,
  fontWeight: 400,
} as const
const X_AXIS_TICK_COUNT_BY_RANGE: Record<ChartRange, number> = {
  '1D': 5,
  '1W': 4,
  '1M': 4,
  '1Y': 4,
  ALL: 4,
}

function getPriceAxisConfig(points: { price: number }[]) {
  const baseline = points[0]?.price ?? 0

  const prices = points.map((p) => p.price)
  const min = Math.min(baseline, ...prices)
  const max = Math.max(baseline, ...prices)

  const dataDistance = Math.max(max - baseline, baseline - min)

  const paddedDistance =
    Math.max(dataDistance, MIN_PRICE_AXIS_DISTANCE) * PRICE_AXIS_PADDING_MULTIPLIER

  const step = paddedDistance / 3

  const stepsBelow = -Math.max(MIN_GRID_STEPS_PER_SIDE, Math.ceil((baseline - min) / step))
  const stepsAbove = Math.max(MIN_GRID_STEPS_PER_SIDE, Math.ceil((max - baseline) / step))

  const ticks = Array.from(
    { length: stepsAbove - stepsBelow + 1 },
    (_, index) => baseline + (stepsBelow + index) * step,
  )

  return {
    baseline,
    ticks,
    domain: [ticks[0], ticks[ticks.length - 1]],
  }
}

function getXAxisTicks(
  points: { x: number }[],
  range: ChartRange,
  intradayTicks: readonly number[],
) {
  if (range === '1D') return intradayTicks

  if (points.length === 0) return []
  if (points.length === 1) return [points[0].x]

  const tickCount = Math.min(X_AXIS_TICK_COUNT_BY_RANGE[range], points.length)
  const lastIndex = points.length - 1

  const sampledIndices = Array.from({ length: tickCount }, (_, tickIndex) =>
    Math.round((tickIndex * lastIndex) / Math.max(tickCount - 1, 1)),
  )

  return Array.from(new Set(sampledIndices)).map((index) => points[index].x)
}

const StockChart = ({ ticker, initialRange = '1D' }: StockChartProps) => {
  const [range, setRange] = useState<ChartRange>(initialRange)
  const { data } = useStockChart(ticker, range)

  const points = !data?.points
    ? []
    : data.points.map((point, index) => ({
        ...point,
        x: range === '1W' || range === '1M' ? index : point.time,
      }))

  const intradayAxis = getIntradayAxisConfig()
  const xAxisTicks = getXAxisTicks(points, range, intradayAxis.ticks)
  const priceAxis = getPriceAxisConfig(points)
  const gridTicks = priceAxis.ticks.filter((tick) => tick !== priceAxis.baseline)

  const baseline = points[0]?.price
  const lastPrice = points.at(-1)?.price

  return (
    <div className="p-25 w-full h-full bg-surface border border-border rounded-xl">
      <div className="flex gap-8">
        {(['1D', '1W', '1M', '1Y', 'ALL'] as ChartRange[]).map((r) => (
          <ChartFilter
            label={r}
            isActive={range === r}
            setActive={(newRange) => setRange(newRange)}
          />
        ))}
      </div>
      <ResponsiveContainer width="100%" height="100%" className="pb-25">
        <LineChart key={`${ticker}-${range}`} data={points}>
          <XAxis
            type="number"
            dataKey="x"
            scale={range === '1D' ? 'time' : 'linear'}
            domain={range === '1D' ? intradayAxis.domain : ['dataMin', 'dataMax']}
            ticks={xAxisTicks}
            axisLine={false}
            tickLine={false}
            minTickGap={24}
            tick={AXIS_TICK_STYLE}
            dy={16}
            tickFormatter={(value) => {
              const point = points[Math.round(value)]
              return formatDate(point?.time ?? value, range)
            }}
          />
          <YAxis
            type="number"
            orientation="right"
            dataKey="price"
            axisLine={false}
            tickLine={false}
            ticks={priceAxis.ticks}
            width={72}
            dx={10}
            tick={AXIS_TICK_STYLE}
            tickFormatter={(value) => formatPrice(value)}
            domain={priceAxis.domain}
          />
          {gridTicks.map((tick) => (
            <ReferenceLine
              key={tick}
              y={tick}
              stroke="var(--color-sparkline)"
              strokeOpacity={0.1}
            />
          ))}
          <ReferenceLine
            y={priceAxis.baseline}
            stroke="var(--color-text)"
            strokeOpacity={0.35}
            strokeDasharray="4 4"
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke={
              baseline == null || lastPrice == null || lastPrice >= baseline
                ? 'var(--color-bullish)'
                : 'var(--color-bearish)'
            }
            strokeWidth={3}
            dot={false}
          />
          <Tooltip
            content={(props) => <CustomTooltip {...props} source={data?.source ?? 'intraday'} />}
            animationDuration={50}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default StockChart

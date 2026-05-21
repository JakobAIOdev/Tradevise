import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  ReferenceLine,
} from 'recharts'
import { CustomTooltip } from './CustomTooltip'
import { formatDate, formatPrice, getIntradayAxisConfig } from '../../utils/chart-helper'
import type { ChartHistoryResponse, ChartRange } from '../../types/chart'
import ChartFilter from './ChartFilter'
import Card, { CardTitle } from '../Card'
import type { ReactNode } from 'react'

interface StockChartProps {
  ticker: string
  range: ChartRange
  onRangeChange: (range: ChartRange) => void
  data?: ChartHistoryResponse
  title?: ReactNode
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
  intraday: 5,
  '1M': 4,
  '6M': 4,
  '1Y': 4,
  '3Y': 4,
  ALL: 4,
}

const RANGE_OPTIONS: Array<{ value: ChartRange; label: string }> = [
  { value: 'intraday', label: 'Intraday' },
  { value: '1M', label: '1M' },
  { value: '6M', label: '6M' },
  { value: '1Y', label: '1Y' },
  { value: '3Y', label: '3Y' },
  { value: 'ALL', label: 'All' },
]

function normalizeChartPoints(data: ChartHistoryResponse | undefined, range: ChartRange) {
  if (!data?.points) return []

  return data.points
    .filter((point) => Number.isFinite(point.time) && Number.isFinite(point.price))
    .sort((a, b) => a.time - b.time)
    .map((point, index) => ({
      ...point,
      x: range === 'intraday' ? point.time : index,
    }))
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
  if (range === 'intraday') return intradayTicks

  if (points.length === 0) return []
  if (points.length === 1) return [points[0].x]

  const tickCount = Math.min(X_AXIS_TICK_COUNT_BY_RANGE[range], points.length)
  const lastIndex = points.length - 1

  const sampledIndices = Array.from({ length: tickCount }, (_, tickIndex) =>
    Math.round((tickIndex * lastIndex) / Math.max(tickCount - 1, 1)),
  )

  return Array.from(new Set(sampledIndices)).map((index) => points[index].x)
}

function getPriceAxisWidth(ticks: number[]) {
  const longestLabelLength = ticks.reduce((max, tick) => {
    return Math.max(max, formatPrice(tick).length)
  }, 0)

  return longestLabelLength * 10
}

const StockChart = ({ ticker, range, onRangeChange, data, title }: StockChartProps) => {
  const points = normalizeChartPoints(data, range)

  const intradayAxis = getIntradayAxisConfig(points[0]?.time)
  const xAxisTicks = getXAxisTicks(points, range, intradayAxis.ticks)
  const priceAxis = getPriceAxisConfig(points)
  const priceAxisWidth = getPriceAxisWidth(priceAxis.ticks)
  const gridTicks = priceAxis.ticks.filter((tick) => tick !== priceAxis.baseline)

  const baseline = points[0]?.price
  const lastPrice = points.at(-1)?.price
  const isPositive = baseline == null || lastPrice == null || lastPrice >= baseline
  const lineTone = isPositive ? 'text-bullish' : 'text-bearish'

  return (
    <Card
      className="flex h-full w-full flex-col"
      title={
        <CardTitle
          className="justify-start flex-wrap"
          leading={
            <div className="flex flex-wrap gap-8">
              {RANGE_OPTIONS.map((option) => (
                <ChartFilter
                  key={option.value}
                  label={option.label}
                  isActive={range === option.value}
                  setActive={onRangeChange}
                  value={option.value}
                />
              ))}
            </div>
          }
        >
          {title}
        </CardTitle>
      }
    >
      <div className="min-h-0 flex-1 pb-25">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart key={`${ticker}-${range}`} data={points}>
            <XAxis
              type="number"
              dataKey="x"
              scale={range === 'intraday' ? 'time' : 'linear'}
              domain={range === 'intraday' ? intradayAxis.domain : ['dataMin', 'dataMax']}
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
              width={priceAxisWidth}
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
              className={lineTone}
              type="monotone"
              dataKey="price"
              stroke="currentColor"
              strokeWidth={3}
              dot={false}
              isAnimationActive={false}
            />
            <Tooltip
              content={(props) => <CustomTooltip {...props} source={data?.source ?? 'intraday'} />}
              animationDuration={50}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

export default StockChart

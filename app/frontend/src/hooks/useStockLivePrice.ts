import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Stock, StockStatistics } from '../types'
import { buildApiUrl } from '../lib/api'
import { useAuthStore } from '../stores/authStore'
import type { ChartHistoryResponse, GraphPoint } from '../types/chart'

type LiveStockEvent = {
  symbol: string
  price?: number
  time: number
  change?: number
  changePercent?: number
  previousClose?: number
  dayHigh?: number
  dayLow?: number
  fiftyTwoWeekHigh?: number
  fiftyTwoWeekLow?: number
  intradayPoint?: GraphPoint
}

type RawIntradayPoint = GraphPoint & {
  Time?: number
  Price?: number
}

function normalizeIntradayPoint(point?: RawIntradayPoint): GraphPoint | undefined {
  if (!point) return undefined

  const time = typeof point.time === 'number' ? point.time : point.Time
  const price = typeof point.price === 'number' ? point.price : point.Price

  if (typeof time !== 'number' || typeof price !== 'number') {
    return undefined
  }

  return { time, price }
}

function mergeIntradayPoints(points: GraphPoint[], nextPoint?: GraphPoint) {
  if (!nextPoint) return points
  if (points.length === 0) return [nextPoint]

  const latestPoint = points[points.length - 1]
  if (latestPoint.time === nextPoint.time) {
    return [...points.slice(0, -1), nextPoint]
  }
  if (latestPoint.time < nextPoint.time) {
    return [...points, nextPoint]
  }

  return points
}

function mergeChartResponse(
  chart: ChartHistoryResponse | undefined,
  payload: LiveStockEvent,
): ChartHistoryResponse | undefined {
  if (!chart || chart.symbol !== payload.symbol) return chart

  if (chart.range === 'intraday') {
    return {
      ...chart,
      points: mergeIntradayPoints(chart.points, payload.intradayPoint),
    }
  }

  if (typeof payload.price !== 'number' || payload.price <= 0 || chart.points.length === 0) {
    return chart
  }

  const points = [...chart.points]
  const lastPoint = points[points.length - 1]
  points[points.length - 1] = {
    ...lastPoint,
    price: payload.price,
  }

  return {
    ...chart,
    points,
  }
}

function shouldHydrateCharts(
  charts: Array<[readonly unknown[], ChartHistoryResponse | undefined]>,
) {
  if (charts.length === 0) return true

  return charts.some(([, chart]) => !chart || chart.points.length === 0)
}

function shouldRefetchStatistics(statistics?: StockStatistics) {
  if (!statistics) return true

  return !statistics.name || !statistics.currency || !statistics.exchange
}

export function useStockLivePrice(ticker: string) {
  const accessToken = useAuthStore((state) => state.accessToken)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!ticker || !accessToken) return

    const params = new URLSearchParams({ access_token: accessToken })
    const events = new EventSource(
      buildApiUrl(`/stocks/${encodeURIComponent(ticker)}/live?${params.toString()}`),
    )

    events.onmessage = (event) => {
      const payload = JSON.parse(event.data) as LiveStockEvent
      const normalizedPayload = {
        ...payload,
        intradayPoint: normalizeIntradayPoint(
          payload.intradayPoint as RawIntradayPoint | undefined,
        ),
      }
      const cachedChartsBeforeUpdate = queryClient.getQueriesData<ChartHistoryResponse>({
        queryKey: ['stock-chart', ticker],
      })
      const shouldHydrateChartData = shouldHydrateCharts(cachedChartsBeforeUpdate)

      queryClient.setQueryData<Stock>(['stock-detail', ticker], (stock) => {
        if (!stock || stock.ticker !== normalizedPayload.symbol) return stock

        const price =
          typeof normalizedPayload.price === 'number' && normalizedPayload.price > 0
            ? normalizedPayload.price
            : stock.price
        const change = normalizedPayload.changePercent ?? stock.change
        return {
          ...stock,
          price,
          change,
          changeValue: normalizedPayload.change ?? stock.changeValue,
          positiveChange: change >= 0,
        }
      })

      queryClient.setQueryData<StockStatistics>(['stock-statistics', ticker], (statistics) => {
        if (!statistics || statistics.symbol !== normalizedPayload.symbol) return statistics

        return {
          ...statistics,
          previousClose: normalizedPayload.previousClose ?? statistics.previousClose,
          dayHigh: normalizedPayload.dayHigh ?? statistics.dayHigh,
          dayLow: normalizedPayload.dayLow ?? statistics.dayLow,
          fiftyTwoWeekHigh: normalizedPayload.fiftyTwoWeekHigh ?? statistics.fiftyTwoWeekHigh,
          fiftyTwoWeekLow: normalizedPayload.fiftyTwoWeekLow ?? statistics.fiftyTwoWeekLow,
        }
      })

      queryClient.setQueriesData<ChartHistoryResponse>(
        { queryKey: ['stock-chart', ticker] },
        (chart) => mergeChartResponse(chart, normalizedPayload),
      )

      if (shouldHydrateChartData) {
        void queryClient.invalidateQueries({ queryKey: ['stock-chart', ticker] })
      }

      const cachedStatistics = queryClient.getQueryData<StockStatistics>([
        'stock-statistics',
        ticker,
      ])
      if (shouldRefetchStatistics(cachedStatistics)) {
        void queryClient.invalidateQueries({ queryKey: ['stock-statistics', ticker] })
      }
    }

    return () => events.close()
  }, [accessToken, queryClient, ticker])
}

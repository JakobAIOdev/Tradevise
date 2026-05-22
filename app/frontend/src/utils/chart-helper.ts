import type { ChartRange } from '../types/chart'

const CHART_TIME_ZONE = 'Europe/Berlin'

function getZonedDateParts(timestamp: number) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: CHART_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(timestamp * 1000))

  const partValue = (type: string) => Number(parts.find((part) => part.type === type)?.value)

  return {
    year: partValue('year'),
    month: partValue('month'),
    day: partValue('day'),
  }
}

function getTimeZoneOffset(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: CHART_TIME_ZONE,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date)

  const partValue = (type: string) => Number(parts.find((part) => part.type === type)?.value)
  const zonedAsUtc = Date.UTC(
    partValue('year'),
    partValue('month') - 1,
    partValue('day'),
    partValue('hour'),
    partValue('minute'),
    partValue('second'),
  )

  return zonedAsUtc - date.getTime()
}

function zonedTimeToTimestamp(year: number, month: number, day: number, hour: number) {
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, 0, 0, 0))
  const offset = getTimeZoneOffset(utcGuess)
  const correctedDate = new Date(utcGuess.getTime() - offset)
  const correctedOffset = getTimeZoneOffset(correctedDate)

  return Math.floor((utcGuess.getTime() - correctedOffset) / 1000)
}

export function getIntradayAxisConfig(anchorTimestamp?: number) {
  const anchor = anchorTimestamp ?? Math.floor(Date.now() / 1000)
  const { year, month, day } = getZonedDateParts(anchor)

  const atTime = (hour: number) => zonedTimeToTimestamp(year, month, day, hour)

  return {
    domain: [atTime(7), atTime(23)] as const,
    ticks: [atTime(7), atTime(11), atTime(15), atTime(19), atTime(23)],
  }
}

export const formatDate = (timestamp: number, range: ChartRange) => {
  const date = new Date(timestamp * 1000)

  if (range === 'intraday')
    return new Intl.DateTimeFormat('de-AT', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: CHART_TIME_ZONE,
    }).format(date)
  else if (range === '1Y' || range === '3Y' || range === 'ALL')
    return new Intl.DateTimeFormat('de-AT', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: CHART_TIME_ZONE,
    }).format(date)
  else
    return new Intl.DateTimeFormat('de-AT', {
      day: 'numeric',
      month: 'short',
      timeZone: CHART_TIME_ZONE,
    }).format(date)
}

export const formatPrice = (price: number) => {
  return (
    new Intl.NumberFormat('de-AT', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price) + ' €'
  )
}

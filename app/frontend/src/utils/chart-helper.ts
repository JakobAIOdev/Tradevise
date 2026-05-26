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

function getZonedDateTimeParts(date: Date) {
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

  return {
    year: partValue('year'),
    month: partValue('month'),
    day: partValue('day'),
    hour: partValue('hour'),
    minute: partValue('minute'),
    second: partValue('second'),
  }
}

function getTimeZoneOffset(date: Date) {
  const parts = getZonedDateTimeParts(date)
  const zonedAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  )

  return zonedAsUtc - date.getTime()
}

function zonedTimeToTimestamp(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute = 0,
) {
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0))
  const offset = getTimeZoneOffset(utcGuess)
  const correctedDate = new Date(utcGuess.getTime() - offset)
  const correctedOffset = getTimeZoneOffset(correctedDate)

  return Math.floor((utcGuess.getTime() - correctedOffset) / 1000)
}

export function getIntradayAxisConfig(anchorTimestamp?: number) {
  const anchor = anchorTimestamp ?? Math.floor(Date.now() / 1000)
  const { year, month, day } = getZonedDateParts(anchor)
  const now = getZonedDateTimeParts(new Date())

  const atTime = (hour: number, minute = 0) => zonedTimeToTimestamp(year, month, day, hour, minute)
  const start = atTime(7)
  const close = atTime(23)
  const isToday = now.year === year && now.month === month && now.day === day
  const current = isToday ? atTime(now.hour, now.minute) : close
  const end = Math.min(Math.max(current, start), close)

  const tickHours = [7, 11, 15, 19, 23]
  const ticks = tickHours.map((hour) => atTime(hour)).filter((tick) => tick >= start && tick < end)
  if (!ticks.includes(end)) ticks.push(end)

  return {
    domain: [start, end] as const,
    ticks,
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

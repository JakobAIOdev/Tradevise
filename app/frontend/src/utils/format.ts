export function formatMoney(value: number) {
  const amount = new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true,
  }).format(value)

  return `${amount} €`
}

export function formatSignedMoney(value: number) {
  return `${value >= 0 ? '+ ' : '- '}${formatMoney(Math.abs(value))}`
}

export function formatSignedPercent(value: number) {
  return `${value >= 0 ? '+ ' : '- '}${Math.abs(value).toFixed(2)} %`
}

export function formatInputNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2)
}

export function formatShares(value: number) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 6,
  }).format(value)
}

export function buildStockLogoUrl(symbol: string) {
  return `https://api.elbstream.com/logos/isin/${encodeURIComponent(symbol)}`
}

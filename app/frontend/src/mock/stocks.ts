import type { Stock } from '../Types'

const logo = (ticker: string) => `https://api.elbstream.com/logos/symbol/${ticker}`

export const MOCK_STOCKS: Stock[] = [
  { name: 'Apple Inc.', ticker: 'AAPL', change: 1.23, logo: logo('AAPL') },
  { name: 'Tesla', ticker: 'TSLA', change: -2.45, logo: logo('TSLA') },
  { name: 'Microsoft', ticker: 'MSFT', change: 0.87, logo: logo('MSFT') },
  { name: 'Amazon', ticker: 'AMZN', change: -0.34, logo: logo('AMZN') },
  { name: 'NVIDIA', ticker: 'NVDA', change: 3.12, logo: logo('NVDA') },
  { name: 'Alphabet', ticker: 'GOOGL', change: 0.56, logo: logo('GOOGL') },
]

export const MOCK_CRYPTOS: Stock[] = [
  { name: 'Bitcoin', ticker: 'BTC', change: 2.34, logo: logo('BTC') },
  { name: 'Ethereum', ticker: 'ETH', change: -1.12, logo: logo('ETH') },
  { name: 'Solana', ticker: 'SOL', change: 4.56, logo: logo('SOL') },
  { name: 'Cardano', ticker: 'ADA', change: -0.78, logo: logo('ADA') },
  { name: 'XRP', ticker: 'XRP', change: 1.9, logo: logo('XRP') },
  { name: 'Dogecoin', ticker: 'DOGE', change: -3.21, logo: logo('DOGE') },
]

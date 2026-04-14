import type { Stock } from '../Types'

const YAHOO_LOGOS: Record<string, string> = {
  AAPL: 'https://s.yimg.com/lb/brands/150x150_apple.png',
  TSLA: 'https://s.yimg.com/lb/brands/150x150_tesla.png',
  MSFT: 'https://s.yimg.com/lb/brands/150x150_microsoft.png',
  AMZN: 'https://s.yimg.com/lb/brands/150x150_amazon.png',
  NVDA: 'https://s.yimg.com/lb/brands/150x150_nvidia.png',
  GOOGL: 'https://s.yimg.com/lb/brands/150x150_google.png',
  BTC: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png',
  ETH: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
  SOL: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png',
  ADA: 'https://s2.coinmarketcap.com/static/img/coins/64x64/2010.png',
  XRP: 'https://s2.coinmarketcap.com/static/img/coins/64x64/52.png',
  DOGE: 'https://s2.coinmarketcap.com/static/img/coins/64x64/74.png',
}

const logo = (ticker: string) => YAHOO_LOGOS[ticker]

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

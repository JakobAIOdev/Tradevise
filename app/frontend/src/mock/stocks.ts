import type { Stock } from '../types'

const CRYPTO_LOGOS: Record<string, string> = {
  BTC: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png',
  ETH: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
  SOL: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png',
  ADA: 'https://s2.coinmarketcap.com/static/img/coins/64x64/2010.png',
  XRP: 'https://s2.coinmarketcap.com/static/img/coins/64x64/52.png',
  DOGE: 'https://s2.coinmarketcap.com/static/img/coins/64x64/74.png',
}

const logo = (ticker: string) => CRYPTO_LOGOS[ticker]

export const MOCK_CRYPTOS: Stock[] = [
  { name: 'Bitcoin', ticker: 'BTC', change: 2.34, logo: logo('BTC') },
  { name: 'Ethereum', ticker: 'ETH', change: -1.12, logo: logo('ETH') },
  { name: 'Solana', ticker: 'SOL', change: 4.56, logo: logo('SOL') },
  { name: 'Cardano', ticker: 'ADA', change: -0.78, logo: logo('ADA') },
  { name: 'XRP', ticker: 'XRP', change: 1.9, logo: logo('XRP') },
  { name: 'Dogecoin', ticker: 'DOGE', change: -3.21, logo: logo('DOGE') },
]

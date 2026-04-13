export const getTrend = (value: number): 'positive' | 'negative' | 'neutral' =>
  value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral'

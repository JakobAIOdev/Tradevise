import { useQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import type { StockSuggestion } from '../Types'
import { buildApiUrl } from '../lib/api'

async function fetchStockSuggestions(query: string): Promise<StockSuggestion[]> {
  const params = new URLSearchParams({ q: query })
  const res = await fetch(buildApiUrl(`/stocks/search?${params.toString()}`))

  if (!res.ok) throw new Error('Search failed')

  return (await res.json()) as StockSuggestion[]
}

export function useStockSearch(input: string) {
  const [debouncedQuery, setDebouncedQuery] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(input.trim()), 300)
    return () => clearTimeout(timer)
  }, [input])

  return useQuery<StockSuggestion[]>({
    queryKey: ['stock-search', debouncedQuery],
    queryFn: () => fetchStockSuggestions(debouncedQuery),
    enabled: debouncedQuery.length >= 1,
    staleTime: 1000 * 30,
    placeholderData: (prev) => prev,
  })
}

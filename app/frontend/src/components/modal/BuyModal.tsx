import { useQuery } from '@tanstack/react-query'
import Modal from './Modal'
import BuyModalContent from './BuyModalContent'
import type { Stock } from '../../types'

interface BuyModalProps {
  isOpen: boolean
  onClose: () => void
  symbol?: string
  name?: string
  price?: number
}

export function BuyModal({ isOpen, onClose, symbol, name, price }: BuyModalProps) {
  const { data: liveStock } = useQuery<Stock | undefined>({
    queryKey: ['stock-detail', symbol ?? ''],
    queryFn: async () => undefined,
    enabled: false,
  })

  const livePrice = liveStock && liveStock.ticker === symbol ? liveStock.price : undefined
  const stockName = liveStock && liveStock.ticker === symbol ? liveStock.name : name
  const resolvedPrice = typeof livePrice === 'number' && livePrice > 0 ? livePrice : price
  const currentPrice = typeof resolvedPrice === 'number' && resolvedPrice > 0 ? resolvedPrice : null

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <BuyModalContent
        key={symbol ?? 'buy-modal'}
        onClose={onClose}
        symbol={symbol}
        name={stockName}
        currentPrice={currentPrice}
      />
    </Modal>
  )
}

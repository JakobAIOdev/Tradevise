import { useModalStore } from '../../stores/useModalStore'
import { BuyModal } from './BuyModal'
import SellModal from './SellModal'

export default function ModalRoot() {
  const { activeModal, payload, close } = useModalStore()
  return (
    <>
      <BuyModal
        isOpen={activeModal === 'buy'}
        onClose={close}
        symbol={payload.symbol}
        price={payload.price}
      />
      <SellModal
        isOpen={activeModal === 'sell'}
        onClose={close}
        symbol={payload.symbol}
        price={payload.price}
      />
    </>
  )
}

import { create } from 'zustand'

type ModalType = 'buy' | 'sell'

interface ModalPayload {
  symbol?: string
  price?: number
  portfolioId?: string
}

interface ModalStore {
  activeModal: ModalType | null
  payload: ModalPayload
  open: (modal: ModalType, payload?: ModalPayload) => void
  close: () => void
}

export const useModalStore = create<ModalStore>((set) => ({
  activeModal: null,
  payload: {},
  open: (modal, payload = {}) => set({ activeModal: modal, payload }),
  close: () => set({ activeModal: null, payload: {} }),
}))

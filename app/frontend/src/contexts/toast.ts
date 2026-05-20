import { createContext } from 'react'

export type MessageType = 'error' | 'success'

export type ToastContextType = {
  showMessage: (message: string, type?: MessageType, duration?: number) => void
  isVisible: boolean
  type: MessageType
  message: string
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined)

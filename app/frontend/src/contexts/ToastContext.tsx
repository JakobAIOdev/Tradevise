import { createContext, useContext, useRef, useState } from 'react'

export type MessageType = 'error' | 'success'

type ToastState = {
  message: string
  type: MessageType
  isVisible: boolean
}

type ToastContextType = {
  showMessage: (message: string, type?: MessageType, duration?: number) => void
  isVisible: boolean
  type: MessageType
  message: string
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState>({
    message: '',
    type: 'success',
    isVisible: false,
  })

  const timeoutRef = useRef<number | undefined>(undefined)

  function showMessage(message: string, type: MessageType = 'success', duration = 4000) {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current)
    }

    setToast({
      message,
      type,
      isVisible: true,
    })

    timeoutRef.current = window.setTimeout(() => {
      setToast((prev) => ({
        ...prev,
        isVisible: false,
      }))
    }, duration)
  }

  return (
    <ToastContext.Provider
      value={{
        showMessage,
        isVisible: toast.isVisible,
        type: toast.type,
        message: toast.message,
      }}
    >
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }

  return context
}

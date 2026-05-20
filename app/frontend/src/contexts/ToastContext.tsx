import { useRef, useState, type ReactNode } from 'react'
import { ToastContext, type MessageType } from './toast'

type ToastState = {
  message: string
  type: MessageType
  isVisible: boolean
}

export function ToastProvider({ children }: { children: ReactNode }) {
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

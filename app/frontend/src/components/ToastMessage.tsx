import { useToast } from '../contexts/toast'

export default function ToastMessage() {
  const { isVisible, type, message } = useToast()

  return (
    <div
      className={`pointer-events-none fixed top-6 left-1/2 z-100 max-w-2xl -translate-x-1/2 transform transition-all duration-500 ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-[400%] opacity-0'
      }`}
    >
      <p
        className={`rounded-full px-5 py-2 text-center shadow-lg ${
          type === 'success' ? 'bg-success text-text' : 'bg-error text-white'
        }`}
      >
        {message}
      </p>
    </div>
  )
}

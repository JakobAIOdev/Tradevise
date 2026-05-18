interface ActionButtonProps {
  label: 'Buy' | 'Sell'
  action: () => void
  disabled?: boolean
}

export default function ActionButton({ label, action, disabled = false }: ActionButtonProps) {
  return (
    <button
      onClick={action}
      disabled={disabled}
      className={`px-6 py-2 rounded-xl font-bold text-surface w-full
          ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
          ${label === 'Buy' ? 'bg-bullish' : 'bg-bearish'}`}
    >
      {label}
    </button>
  )
}

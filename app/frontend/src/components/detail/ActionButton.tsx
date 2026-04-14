interface ActionButtonProps {
  label: 'Buy' | 'Sell'
  action: () => void
}

export default function ActionButton({ label, action }: ActionButtonProps) {
  return (
    <button
      onClick={action}
      className={`cursor-pointer px-6 py-2 rounded-lg font-bold text-surface w-full
        ${label === 'Buy' ? 'bg-bullish' : 'bg-bearish'}`}
    >
      {label}
    </button>
  )
}

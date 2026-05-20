import Button from '../Button'

interface ActionButtonProps {
  label: 'Buy' | 'Sell'
  action: () => void
  disabled?: boolean
}

export default function ActionButton({ label, action, disabled = false }: ActionButtonProps) {
  return (
    <Button
      variant={label === 'Buy' ? 'bullish' : 'bearish'}
      fullWidth
      className="rounded-xl"
      onClick={action}
      disabled={disabled}
    >
      {label}
    </Button>
  )
}

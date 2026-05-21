import { useMemo, useState } from 'react'
import { ChevronRight, X } from 'lucide-react'
import { usePortfolio } from '../../hooks/usePortfolio'
import { useTradeStock } from '../../hooks/useTradeStock'
import { formatInputNumber, formatMoney, formatShares } from '../../utils/format'
import {
  getOrderAmount,
  getQuantityFromTradeInput,
  parseNumberInput,
} from '../../utils/trade-order'
import { useToast } from '../../contexts/toast'
import Button from '../Button'
import SegmentedControl from '../SegmentedControl'
import TextField from '../TextField'

type BuyMode = 'amount' | 'shares'

interface BuyModalContentProps {
  onClose: () => void
  symbol?: string
  name?: string
  currentPrice: number | null
}

const BUY_MODE_OPTIONS: Array<{ value: BuyMode; label: string }> = [
  { value: 'amount', label: 'Amount' },
  { value: 'shares', label: 'Shares' },
]

export default function BuyModalContent({
  onClose,
  symbol,
  name,
  currentPrice,
}: BuyModalContentProps) {
  const { showMessage } = useToast()
  const [mode, setMode] = useState<BuyMode>('amount')
  const [value, setValue] = useState(currentPrice ? formatInputNumber(currentPrice) : '')
  const [error, setError] = useState<string | null>(null)
  const { data: portfolio } = usePortfolio()
  const buyStock = useTradeStock('buy')
  const stockLabel = name?.trim() || symbol

  const parsedValue = parseNumberInput(value)
  const availableCash = portfolio?.cash ?? 0
  const quantity = useMemo(
    () => getQuantityFromTradeInput({ mode, parsedValue, currentPrice }),
    [currentPrice, mode, parsedValue],
  )

  const orderAmount = getOrderAmount(quantity, currentPrice)
  const canSubmit =
    Boolean(symbol) &&
    Boolean(currentPrice) &&
    Number.isFinite(quantity) &&
    quantity > 0 &&
    orderAmount <= availableCash &&
    !buyStock.isPending

  function handleModeChange(nextMode: BuyMode) {
    if (nextMode === mode) return

    setError(null)
    setMode(nextMode)

    if (nextMode === 'shares') {
      setValue(quantity > 0 ? formatInputNumber(quantity) : '1')
      return
    }

    setValue(
      orderAmount > 0
        ? formatInputNumber(orderAmount)
        : currentPrice
          ? formatInputNumber(currentPrice)
          : '',
    )
  }

  function handleSubmit() {
    setError(null)

    if (!symbol) {
      setError('No stock selected')
      return
    }

    if (!currentPrice) {
      setError('No live price available')
      return
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError(mode === 'amount' ? 'Enter a valid amount' : 'Enter a valid share quantity')
      return
    }

    if (orderAmount > availableCash) {
      setError('Not enough available cash')
      return
    }

    buyStock.mutate(
      {
        symbol,
        quantity,
      },
      {
        onSuccess: () => {
          onClose()
          showMessage(`Bought ${formatShares(quantity)} shares of ${stockLabel}`, 'success')
        },
        onError: (tradeError) => {
          showMessage(tradeError instanceof Error ? tradeError.message : 'Buy failed', 'error')
        },
      },
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-h2 text-text">Invest in {stockLabel}</h2>
          <p className="mt-1 text-small text-muted">{formatMoney(availableCash)} available</p>
        </div>
        <Button variant="secondary" size="icon" onClick={onClose} aria-label="Close buy modal">
          <X size={20} strokeWidth={1.5} />
        </Button>
      </div>

      <div className="pt-7.5 pb-40">
        <SegmentedControl
          value={mode}
          options={BUY_MODE_OPTIONS}
          onChange={(value) => handleModeChange(value as BuyMode)}
        />
      </div>

      <div className="min-h-38 space-y-3">
        <TextField
          id="buy-value"
          label={mode === 'amount' ? 'Amount' : 'Shares'}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          inputMode="decimal"
          labelClassName="text-body text-text"
          placeholder={
            mode === 'amount' ? (currentPrice ? formatMoney(currentPrice) : 'Amount') : '1'
          }
        />
        <div className="space-y-1">
          <p className="text-body text-text">
            {mode === 'amount'
              ? `${formatShares(quantity)} shares`
              : `${formatMoney(orderAmount)} total`}
          </p>
          <p className="text-small font-semibold text-muted">
            {currentPrice
              ? `Currently ${formatMoney(currentPrice)} per Share`
              : 'Waiting for live price'}
          </p>
        </div>
      </div>

      {error && <p className="text-small text-bearish">{error}</p>}

      <div className="flex justify-end pt-15">
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          trailing={!buyStock.isPending && <ChevronRight size={18} strokeWidth={2} />}
        >
          {buyStock.isPending ? 'Buying...' : 'Buy'}
        </Button>
      </div>
    </div>
  )
}

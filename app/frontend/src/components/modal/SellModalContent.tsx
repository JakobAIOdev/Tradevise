import { useMemo, useState } from 'react'
import { ChevronRight, X } from 'lucide-react'
import { usePortfolio } from '../../hooks/usePortfolio'
import { useTradeStock } from '../../hooks/useTradeStock'
import { formatInputNumber, formatMoney, formatShares } from '../../utils/format'
import { useToast } from '../../contexts/ToastContext'
import Button from '../Button'

type SellMode = 'amount' | 'shares' | 'percentage'
type SellPercentage = 0.25 | 0.5 | 1
type PercentageSelection = SellPercentage | 'custom'

interface SellModalContentProps {
  onClose: () => void
  symbol?: string
  name?: string
  currentPrice: number | null
}

const PERCENTAGE_OPTIONS: { label: string; value: SellPercentage }[] = [
  { label: '25%', value: 0.25 },
  { label: '50%', value: 0.5 },
  { label: '100%', value: 1 },
]

function parseNumberInput(value: string) {
  const normalizedValue = value.replace(',', '.').trim()
  if (!normalizedValue) return 0

  const parsedValue = Number(normalizedValue)
  return Number.isFinite(parsedValue) ? parsedValue : Number.NaN
}

export default function SellModalContent({
  onClose,
  symbol,
  name,
  currentPrice,
}: SellModalContentProps) {
  const { showMessage } = useToast()
  const [mode, setMode] = useState<SellMode>('percentage')
  const [value, setValue] = useState('1')
  const [percentage, setPercentage] = useState<PercentageSelection>(0.25)
  const [customPercentage, setCustomPercentage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const { data: portfolio } = usePortfolio()
  const sellStock = useTradeStock('sell')
  const holding = portfolio?.holdings.find((item) => item.symbol === symbol)
  const stockLabel = name?.trim() || symbol
  const ownedShares = holding?.quantity ?? 0
  const parsedValue = parseNumberInput(value)
  const quantity = useMemo(() => {
    if (mode === 'percentage') {
      const selectedPercentage =
        percentage === 'custom' ? parseNumberInput(customPercentage) / 100 : percentage

      if (
        !Number.isFinite(selectedPercentage) ||
        selectedPercentage <= 0 ||
        selectedPercentage > 1
      ) {
        return 0
      }

      return ownedShares * selectedPercentage
    }

    if (!Number.isFinite(parsedValue) || parsedValue <= 0) return 0
    if (mode === 'shares') return parsedValue
    if (!currentPrice) return 0

    return parsedValue / currentPrice
  }, [currentPrice, customPercentage, mode, ownedShares, parsedValue, percentage])

  const orderAmount = currentPrice ? quantity * currentPrice : 0
  const canSubmit =
    Boolean(symbol) &&
    Boolean(holding) &&
    Boolean(currentPrice) &&
    Number.isFinite(quantity) &&
    quantity > 0 &&
    quantity <= ownedShares &&
    !sellStock.isPending

  function handleModeChange(nextMode: SellMode) {
    if (nextMode === mode) return

    setError(null)
    setMode(nextMode)

    if (nextMode === 'shares') {
      setValue(quantity > 0 ? formatInputNumber(quantity) : '1')
      return
    }

    if (nextMode === 'amount') {
      setValue(
        orderAmount > 0
          ? formatInputNumber(orderAmount)
          : currentPrice
            ? formatInputNumber(currentPrice)
            : '',
      )
    }
  }

  function handlePercentageChange(nextPercentage: SellPercentage) {
    setError(null)
    setMode('percentage')
    setPercentage(nextPercentage)
    setCustomPercentage('')
  }

  function handleCustomPercentage() {
    setError(null)
    setMode('percentage')
    setPercentage('custom')
    setCustomPercentage('')
  }

  function handleSubmit() {
    setError(null)

    if (!symbol) {
      setError('No stock selected')
      return
    }

    if (!holding) {
      setError('You do not own this stock')
      return
    }

    if (!currentPrice) {
      setError('No live price available')
      return
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError(
        mode === 'amount'
          ? 'Enter a valid amount'
          : mode === 'percentage'
            ? 'Enter a percentage between 1 and 100'
            : 'Enter a valid share quantity',
      )
      return
    }

    if (quantity > ownedShares) {
      setError('You cannot sell more shares than you own')
      return
    }

    sellStock.mutate(
      { symbol, quantity },
      {
        onSuccess: () => {
          onClose()
          showMessage(`Sold ${formatShares(quantity)} shares of ${stockLabel}`, 'success')
        },
        onError: (tradeError) => {
          showMessage(tradeError instanceof Error ? tradeError.message : 'Sell failed', 'error')
        },
      },
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-h2 text-text">Sell {stockLabel}</h2>
          <p className="mt-1 text-small text-muted">{formatShares(ownedShares)} shares held</p>
        </div>
        <Button variant="secondary" size="icon" onClick={onClose} aria-label="Close sell modal">
          <X size={20} strokeWidth={1.5} />
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 pt-7.5 pb-40">
        <Button
          variant={mode === 'amount' ? 'primary' : 'secondary'}
          size="none"
          className="rounded-[100px] px-7 py-3 text-body font-normal"
          onClick={() => handleModeChange('amount')}
        >
          Amount
        </Button>
        <Button
          variant={mode === 'shares' ? 'primary' : 'secondary'}
          size="none"
          className="rounded-[100px] px-7 py-3 text-body font-normal"
          onClick={() => handleModeChange('shares')}
        >
          Shares
        </Button>
        <Button
          variant={mode === 'percentage' ? 'primary' : 'secondary'}
          size="none"
          className="rounded-[100px] px-7 py-3 text-body font-normal"
          onClick={() => handleModeChange('percentage')}
        >
          Percentage
        </Button>
      </div>

      {mode === 'percentage' ? (
        <div className="min-h-38 space-y-3">
          <label className="block text-body text-text">Percentage</label>
          <div className="grid grid-cols-4 gap-3">
            {PERCENTAGE_OPTIONS.map((option) => (
              <Button
                key={option.label}
                variant={percentage === option.value ? 'primary' : 'secondary'}
                size="none"
                onClick={() => handlePercentageChange(option.value)}
                className="h-13 px-4 text-body font-normal"
              >
                {option.label}
              </Button>
            ))}
            {percentage === 'custom' ? (
              <input
                value={customPercentage}
                onChange={(event) => setCustomPercentage(event.target.value)}
                inputMode="decimal"
                autoFocus
                className="h-13 rounded-lg border border-text bg-surface px-4 text-center text-body text-text outline-none"
                placeholder="75%"
                aria-label="Custom sell percentage"
              />
            ) : (
              <Button
                variant="secondary"
                size="none"
                onClick={handleCustomPercentage}
                className="h-13 px-4 text-body font-normal"
              >
                Custom
              </Button>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-body text-text">{formatShares(quantity)} shares</p>
            <p className="text-small font-semibold text-muted">
              {currentPrice ? `${formatMoney(orderAmount)} total` : 'Waiting for live price'}
            </p>
          </div>
        </div>
      ) : (
        <div className="min-h-38 space-y-3">
          <label className="block text-body text-text" htmlFor="sell-value">
            {mode === 'amount' ? 'Amount' : 'Shares'}
          </label>
          <input
            id="sell-value"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            inputMode="decimal"
            className="mx-auto h-13 w-4/5 rounded-lg border border-border bg-surface px-5 text-body text-text outline-none focus:border-text"
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
      )}

      {error && <p className="text-small text-bearish">{error}</p>}

      <div className="flex justify-end pt-15">
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          trailing={!sellStock.isPending && <ChevronRight size={18} strokeWidth={2} />}
        >
          {sellStock.isPending ? 'Selling...' : 'Sell'}
        </Button>
      </div>
    </div>
  )
}

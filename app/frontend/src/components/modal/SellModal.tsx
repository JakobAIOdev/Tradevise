import { useEffect, useMemo, useState } from 'react'
import { ChevronRight, X } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import Modal from './Modal'
import { usePortfolio } from '../../hooks/usePortfolio'
import { useTradeStock } from '../../hooks/useTradeStock'
import type { Stock } from '../../Types'
import { formatInputNumber, formatMoney, formatShares } from '../../utils/format'

type SellMode = 'amount' | 'shares' | 'percentage'
type SellPercentage = 0.25 | 0.5 | 1
type PercentageSelection = SellPercentage | 'custom'

interface SellModalProps {
  isOpen: boolean
  onClose: () => void
  symbol?: string
  price?: number
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

export default function SellModal({ isOpen, onClose, symbol, price }: SellModalProps) {
  const [mode, setMode] = useState<SellMode>('percentage')
  const [value, setValue] = useState('1')
  const [percentage, setPercentage] = useState<PercentageSelection>(0.25)
  const [customPercentage, setCustomPercentage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const { data: portfolio } = usePortfolio()
  const sellStock = useTradeStock('sell')
  const { data: liveStock } = useQuery<Stock | undefined>({
    queryKey: ['stock-detail', symbol ?? ''],
    queryFn: async () => undefined,
    enabled: false,
  })

  const holding = portfolio?.holdings.find((item) => item.symbol === symbol)
  const ownedShares = holding?.quantity ?? 0
  const parsedValue = parseNumberInput(value)
  const livePrice = liveStock && liveStock.ticker === symbol ? liveStock.price : undefined
  const resolvedPrice = typeof livePrice === 'number' && livePrice > 0 ? livePrice : price
  const currentPrice = typeof resolvedPrice === 'number' && resolvedPrice > 0 ? resolvedPrice : null

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

  useEffect(() => {
    if (!isOpen) return
    setMode('percentage')
    setValue(ownedShares > 0 ? '1' : '')
    setPercentage(0.25)
    setCustomPercentage('')
    setError(null)
  }, [isOpen, ownedShares, symbol])

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
      {
        symbol,
        quantity,
      },
      {
        onSuccess: () => {
          onClose()
        },
        onError: (tradeError) => {
          setError(tradeError instanceof Error ? tradeError.message : 'Sell failed')
        },
      },
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-h2 text-text">Sell {symbol}</h2>
            <p className="mt-1 text-small text-muted">{formatShares(ownedShares)} shares held</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border p-2 text-text hover:bg-surface-hover hover:cursor-pointer"
            aria-label="Close sell modal"
          >
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex flex-wrap gap-3 pt-7.5 pb-40">
          <button
            type="button"
            onClick={() => handleModeChange('amount')}
            className={`rounded-[100px] px-7 py-3 text-body hover:cursor-pointer ${
              mode === 'amount'
                ? 'bg-text text-surface'
                : 'border border-border bg-surface text-text'
            }`}
          >
            Amount
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('shares')}
            className={`rounded-[100px] px-7 py-3 text-body hover:cursor-pointer ${
              mode === 'shares'
                ? 'bg-text text-surface'
                : 'border border-border bg-surface text-text'
            }`}
          >
            Shares
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('percentage')}
            className={`rounded-[100px] px-7 py-3 text-body hover:cursor-pointer ${
              mode === 'percentage'
                ? 'bg-text text-surface'
                : 'border border-border bg-surface text-text'
            }`}
          >
            Percentage
          </button>
        </div>

        {mode === 'percentage' ? (
          <div className="min-h-38 space-y-3">
            <label className="block text-body text-text">Percentage</label>
            <div className="grid grid-cols-4 gap-3">
              {PERCENTAGE_OPTIONS.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => handlePercentageChange(option.value)}
                  className={`h-13 rounded-lg border px-4 text-body hover:cursor-pointer ${
                    percentage === option.value
                      ? 'border-text bg-text text-surface'
                      : 'border-border bg-surface text-text'
                  }`}
                >
                  {option.label}
                </button>
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
                <button
                  type="button"
                  onClick={handleCustomPercentage}
                  className="h-13 rounded-lg border border-border bg-surface px-4 text-body text-text hover:cursor-pointer"
                >
                  Custom
                </button>
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
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex items-center gap-2 rounded-lg bg-text px-25 py-3 font-bold text-surface disabled:cursor-not-allowed disabled:opacity-60 hover:cursor-pointer"
          >
            {sellStock.isPending ? (
              'Selling...'
            ) : (
              <>
                Sell
                <ChevronRight size={18} strokeWidth={2} />
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  )
}

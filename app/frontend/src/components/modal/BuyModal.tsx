import { useEffect, useMemo, useState } from 'react'
import { ChevronRight, X } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import Modal from './Modal'
import { usePortfolio } from '../../hooks/usePortfolio'
import { useTradeStock } from '../../hooks/useTradeStock'
import type { Stock } from '../../Types'
import { formatInputNumber, formatMoney, formatShares } from '../../utils/format'

type BuyMode = 'amount' | 'shares'

interface BuyModalProps {
  isOpen: boolean
  onClose: () => void
  symbol?: string
  price?: number
}

function parseNumberInput(value: string) {
  const normalizedValue = value.replace(',', '.').trim()
  if (!normalizedValue) return 0

  const parsedValue = Number(normalizedValue)
  return Number.isFinite(parsedValue) ? parsedValue : Number.NaN
}

export function BuyModal({ isOpen, onClose, symbol, price }: BuyModalProps) {
  const [mode, setMode] = useState<BuyMode>('amount')
  const [value, setValue] = useState('200')
  const [error, setError] = useState<string | null>(null)
  const { data: portfolio } = usePortfolio()
  const buyStock = useTradeStock('buy')
  const { data: liveStock } = useQuery<Stock | undefined>({
    queryKey: ['stock-detail', symbol ?? ''],
    queryFn: async () => undefined,
    enabled: false,
  })

  const parsedValue = parseNumberInput(value)
  const livePrice = liveStock && liveStock.ticker === symbol ? liveStock.price : undefined
  const resolvedPrice = typeof livePrice === 'number' && livePrice > 0 ? livePrice : price
  const currentPrice = typeof resolvedPrice === 'number' && resolvedPrice > 0 ? resolvedPrice : null
  const availableCash = portfolio?.cash ?? 0

  const quantity = useMemo(() => {
    if (!Number.isFinite(parsedValue) || parsedValue <= 0) return 0
    if (mode === 'shares') return parsedValue
    if (!currentPrice) return 0

    return parsedValue / currentPrice
  }, [currentPrice, mode, parsedValue])

  const orderAmount = currentPrice ? quantity * currentPrice : 0
  const canSubmit =
    Boolean(symbol) &&
    Boolean(currentPrice) &&
    Number.isFinite(quantity) &&
    quantity > 0 &&
    orderAmount <= availableCash &&
    !buyStock.isPending

  useEffect(() => {
    if (!isOpen) return
    setMode('amount')
    setValue(currentPrice ? formatInputNumber(currentPrice) : '')
    setError(null)
  }, [currentPrice, isOpen, symbol])

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
        },
        onError: (tradeError) => {
          setError(tradeError instanceof Error ? tradeError.message : 'Buy failed')
        },
      },
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-h2 text-text">Invest in {symbol}</h2>
            <p className="mt-1 text-small text-muted">{formatMoney(availableCash)} available</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border p-2 text-text hover:bg-surface-hover hover:cursor-pointer"
            aria-label="Close buy modal"
          >
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex gap-3 pt-7.5 pb-40">
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
        </div>

        <div className="min-h-38 space-y-3">
          <label className="block text-body text-text" htmlFor="buy-value">
            {mode === 'amount' ? 'Amount' : 'Shares'}
          </label>
          <input
            id="buy-value"
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

        {error && <p className="text-small text-bearish">{error}</p>}

        <div className="flex justify-end pt-15">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex items-center gap-2 rounded-lg bg-text px-25 py-3 font-bold text-surface disabled:cursor-not-allowed disabled:opacity-60 hover:cursor-pointer"
          >
            {buyStock.isPending ? (
              'Buying...'
            ) : (
              <>
                Buy
                <ChevronRight size={18} strokeWidth={2} />
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  )
}

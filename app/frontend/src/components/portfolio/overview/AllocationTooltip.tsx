import { formatMoney, formatSignedPercent } from '../../../utils/format'
import type { AllocationSlice } from '../../../utils/portfolio-allocation'

type AllocationTooltipProps = {
  active?: boolean
  payload?: Array<{
    payload: AllocationSlice
  }>
}

export default function AllocationTooltip({ active, payload }: AllocationTooltipProps) {
  const slice = payload?.[0]?.payload

  if (!active || !slice) {
    return null
  }

  return (
    <div className="rounded-lg border border-border bg-surface px-12 py-8 shadow-lg">
      <p className="text-small text-text">{slice.name}</p>
      <p className="text-small text-muted">
        {formatMoney(slice.value)} · {formatSignedPercent(slice.percent).replace('+ ', '')}
      </p>
    </div>
  )
}

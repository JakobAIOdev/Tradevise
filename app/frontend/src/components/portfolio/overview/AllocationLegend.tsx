import type { AllocationSlice } from '../../../utils/portfolio-allocation'

type AllocationLegendProps = {
  allocation: AllocationSlice[]
}

export default function AllocationLegend({ allocation }: AllocationLegendProps) {
  if (allocation.length === 0) {
    return <p className="text-body text-muted">No positions yet.</p>
  }

  return (
    <div className="grid max-h-56 gap-x-25 gap-y-10 overflow-y-auto pr-8 sm:grid-cols-2">
      {allocation.map((slice) => (
        <div key={slice.symbol} className="flex min-w-0 items-center gap-10 text-small text-text">
          <span
            className="size-3.5 shrink-0 rounded-full"
            style={{ backgroundColor: slice.color }}
          />
          <span className="min-w-0 flex-1 truncate" title={slice.name}>
            {slice.name}
          </span>
          <span className="shrink-0 text-small text-muted">
            {slice.percent.toFixed(1).replace('.', ',')}%
          </span>
        </div>
      ))}
    </div>
  )
}

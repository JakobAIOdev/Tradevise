import { Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { AllocationSlice } from '../../../utils/portfolio-allocation'
import AllocationTooltip from './AllocationTooltip'

type AllocationChartProps = {
  allocation: AllocationSlice[]
}

export default function AllocationChart({ allocation }: AllocationChartProps) {
  const chartData = allocation.map((slice) => ({
    ...slice,
    fill: slice.color,
  }))

  return (
    <div className="h-65 min-w-0 md:h-[320px]">
      {allocation.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="symbol"
              innerRadius="42%"
              outerRadius="82%"
              paddingAngle={1}
              stroke="var(--color-surface)"
              strokeWidth={3}
            />
            <Tooltip content={<AllocationTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border text-body text-muted">
          Empty portfolio
        </div>
      )}
    </div>
  )
}

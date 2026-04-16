import type { ChartRange } from '../../hooks/useStockChart'

interface ChartFilterProps {
  label: string
  value: ChartRange
  isActive: boolean
  setActive: (range: ChartRange) => void
}

const ChartFilter = ({ label, value, isActive, setActive }: ChartFilterProps) => {
  const handleClick = () => {
    setActive(value)
  }

  return (
    <button
      className={`px-1 py-0.5 text-small rounded-sm ${isActive ? 'bg-text text-surface' : 'text-text'}`}
      onClick={handleClick}
    >
      {label}
    </button>
  )
}

export default ChartFilter

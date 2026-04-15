import type { ChartRange } from '../../hooks/useStockChart'

interface ChartFilterProps {
  label: ChartRange
  isActive: boolean
  setActive: (range: ChartRange) => void
}

const ChartFilter = ({ label, isActive, setActive }: ChartFilterProps) => {
  const handleClick = () => {
    setActive(label)
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

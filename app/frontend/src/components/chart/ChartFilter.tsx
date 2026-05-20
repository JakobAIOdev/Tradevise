import type { ChartRange } from '../../types/chart'
import Button from '../Button'

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
    <Button
      variant={isActive ? 'primary' : 'ghost'}
      size="none"
      className="rounded-sm px-1 py-0.5 text-small font-normal"
      onClick={handleClick}
    >
      {label}
    </Button>
  )
}

export default ChartFilter

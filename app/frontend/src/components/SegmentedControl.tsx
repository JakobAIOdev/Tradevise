import type { ReactNode } from 'react'
import Button from './Button'

type SegmentedControlOption = {
  value: string
  label: ReactNode
  disabled?: boolean
}

type SegmentedControlProps = {
  value: string
  options: readonly SegmentedControlOption[]
  onChange: (value: string) => void
  className?: string
  optionClassName?: string
  activeOptionClassName?: string
  inactiveOptionClassName?: string
}

const SegmentedControl = ({
  value,
  options,
  onChange,
  className,
  optionClassName,
  activeOptionClassName,
  inactiveOptionClassName,
}: SegmentedControlProps) => {
  return (
    <div
      className={`grid gap-1.5 rounded-[20px] bg-surface-hover p-1.5 ${className ?? ''}`}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((option) => {
        const isActive = option.value === value

        return (
          <Button
            key={option.value}
            variant={isActive ? 'surface' : 'ghost'}
            size="none"
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
            className={`rounded-[14px] py-3 text-body ${
              isActive ? 'font-bold' : 'font-normal text-muted hover:bg-surface/60'
            } ${optionClassName ?? ''} ${
              isActive ? (activeOptionClassName ?? '') : (inactiveOptionClassName ?? '')
            }`}
          >
            {option.label}
          </Button>
        )
      })}
    </div>
  )
}

export default SegmentedControl

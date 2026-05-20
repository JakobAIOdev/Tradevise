import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'surface' | 'ghost' | 'bullish' | 'bearish'
type ButtonSize = 'none' | 'sm' | 'md' | 'icon'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  leading?: ReactNode
  trailing?: ReactNode
}

const variantClass: Record<ButtonVariant, string> = {
  primary: 'bg-text text-surface hover:opacity-90',
  secondary: 'border border-border bg-surface text-text hover:bg-surface-hover',
  surface: 'bg-surface text-text hover:bg-surface/80',
  ghost: 'text-text hover:bg-surface-hover',
  bullish: 'bg-bullish text-surface hover:opacity-90',
  bearish: 'bg-bearish text-surface hover:opacity-90',
}

const sizeClass: Record<ButtonSize, string> = {
  none: '',
  sm: 'rounded-lg px-15 py-2 text-small',
  md: 'rounded-lg px-25 py-3 text-body',
  icon: 'rounded-lg p-2',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  leading,
  trailing,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-8 font-bold transition disabled:cursor-not-allowed disabled:opacity-60 enabled:hover:cursor-pointer ${variantClass[variant]} ${sizeClass[size]} ${fullWidth ? 'w-full' : ''} ${className ?? ''}`}
      {...props}
    >
      {leading}
      {children}
      {trailing}
    </button>
  )
}

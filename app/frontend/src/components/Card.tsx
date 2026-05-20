import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react'

type CardPadding = 'none' | 'sm' | 'md'
type CardTitleSpacing = 'none' | 'sm' | 'md'

type CardProps = Omit<ComponentPropsWithoutRef<'div'>, 'title'> & {
  as?: ElementType
  title?: ReactNode
  padding?: CardPadding
  titleSpacing?: CardTitleSpacing
}

type CardTitleProps = {
  children?: ReactNode
  leading?: ReactNode
  trailing?: ReactNode
  className?: string
  titleClassName?: string
  leadingClassName?: string
  trailingClassName?: string
}

const paddingClass: Record<CardPadding, string> = {
  none: '',
  sm: 'p-15',
  md: 'p-25',
}

const titleSpacingClass: Record<CardTitleSpacing, string> = {
  none: '',
  sm: 'mb-4',
  md: 'mb-18',
}

export default function Card({
  as: Component = 'div',
  title,
  padding = 'md',
  titleSpacing = 'md',
  className,
  children,
  ...props
}: CardProps) {
  return (
    <Component
      className={`rounded-xl border border-border bg-surface ${paddingClass[padding]} ${className ?? ''}`}
      {...props}
    >
      {title && <div className={titleSpacingClass[titleSpacing]}>{title}</div>}
      {children}
    </Component>
  )
}

export function CardTitle({
  children,
  leading,
  trailing,
  className,
  titleClassName,
  leadingClassName,
  trailingClassName,
}: CardTitleProps) {
  return (
    <div className={`flex items-center justify-between gap-12 ${className ?? ''}`}>
      <div className="flex min-w-0 items-center gap-8">
        {leading && (
          <span className={`flex shrink-0 items-center text-muted ${leadingClassName ?? ''}`}>
            {leading}
          </span>
        )}
        {children && (
          <div className={`truncate text-body font-bold text-text ${titleClassName ?? ''}`}>
            {children}
          </div>
        )}
      </div>

      {trailing && <div className={`shrink-0 ${trailingClassName ?? ''}`}>{trailing}</div>}
    </div>
  )
}

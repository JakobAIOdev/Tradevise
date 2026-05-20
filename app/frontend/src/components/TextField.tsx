import type { InputHTMLAttributes, ReactNode } from 'react'

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> & {
  label: ReactNode
  error?: ReactNode
  hint?: ReactNode
  containerClassName?: string
  inputClassName?: string
  labelClassName?: string
}

const TextField = ({
  label,
  error,
  hint,
  containerClassName,
  inputClassName,
  labelClassName,
  id,
  ...inputProps
}: TextFieldProps) => {
  return (
    <label className={`flex flex-col gap-6 ${containerClassName ?? ''}`}>
      <span className={`text-small text-muted ${labelClassName ?? ''}`}>{label}</span>
      <input
        id={id}
        className={`h-13 rounded-lg border border-border bg-surface px-5 text-body text-text outline-none focus:border-text ${
          error ? 'border-error focus:border-error' : ''
        } ${inputClassName ?? ''}`}
        aria-invalid={Boolean(error) || undefined}
        {...inputProps}
      />
      {hint && <span className="text-small font-semibold text-muted">{hint}</span>}
      {error && <span className="text-small text-error">{error}</span>}
    </label>
  )
}

export default TextField

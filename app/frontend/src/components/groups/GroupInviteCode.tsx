import { useState } from 'react'
import Button from '../Button'

type GroupInviteCodeProps = {
  code: string
}

export default function GroupInviteCode({ code }: GroupInviteCodeProps) {
  const [hasCopiedCode, setHasCopiedCode] = useState(false)

  function copyCode() {
    void navigator.clipboard.writeText(code)
    setHasCopiedCode(true)
  }

  return (
    <div className="my-5 flex w-fit items-center overflow-hidden rounded-lg border border-border bg-surface">
      <div className="border-r border-border px-3 py-2">
        <p className="text-[0.7rem] font-bold uppercase leading-none tracking-wide text-muted">
          Code
        </p>
        <p className="mt-1 text-body font-bold leading-none tracking-widest text-text">{code}</p>
      </div>
      <Button
        variant="ghost"
        size="none"
        onClick={copyCode}
        className="px-3 py-3 text-small font-bold text-text transition-colors hover:cursor-pointer hover:bg-surface-hover"
      >
        {hasCopiedCode ? 'Copied' : 'Copy'}
      </Button>
    </div>
  )
}

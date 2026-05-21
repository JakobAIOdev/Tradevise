import StockLogo from './StockLogo'

type AssetIdentityProps = {
  symbol: string
  name: string
  logoUrl: string | null
  detail?: string
  logoSize?: number
  nameClassName?: string
}

export default function AssetIdentity({
  symbol,
  name,
  logoUrl,
  detail,
  logoSize = 48,
  nameClassName = 'text-body text-text',
}: AssetIdentityProps) {
  return (
    <div className="flex min-w-0 items-center gap-4">
      <StockLogo src={logoUrl ?? ''} ticker={symbol} size={logoSize} />
      <div className="min-w-0">
        <div className={`truncate ${nameClassName}`}>{name}</div>
        <div className="truncate text-small text-muted">{detail ?? symbol}</div>
      </div>
    </div>
  )
}

import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function PortfolioActions() {
  return (
    <Link
      to="/portfolio/transactions"
      className="group flex w-fit items-center gap-8 text-body text-text transition-colors hover:text-muted"
    >
      <span>See Transactions</span>
      <ChevronRight
        size={22}
        strokeWidth={2}
        className="transition-transform group-hover:translate-x-1"
      />
    </Link>
  )
}

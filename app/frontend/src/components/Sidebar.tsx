import { ArrowUpDown, LayoutDashboard, Search, Trophy, Users, Wallet } from 'lucide-react'
import { useState } from 'react'
import NavItem from './NavItem'
import { useAuthStore } from '../stores/authStore'
import { usePortfolios } from '../hooks/usePortfolios'
import PortfolioSwitcherModal from './PortfolioSwitcherModal'

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Home' },
  { to: '/portfolio', icon: Wallet, label: 'Portfolio' },
  { to: '/discover', icon: Search, label: 'Discover' },
  { to: '/ranking', icon: Trophy, label: 'Ranking' },
  { to: '/groups', icon: Users, label: 'Groups' },
]

interface SidebarProps {
  collapsed: boolean
  mobileOpen: boolean
  onNavigate: () => void
}

export default function Sidebar({ collapsed, mobileOpen, onNavigate }: SidebarProps) {
  const [portfolioModalOpen, setPortfolioModalOpen] = useState(false)
  const user = useAuthStore((state) => state.user)
  const { data } = usePortfolios()
  const activePortfolio = data?.portfolios.find((portfolio) => portfolio.isActive)

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-screen flex-col border-r border-border bg-surface py-25 shadow-xl
      transition-[transform,width,padding,background-color,border-color] duration-200 ease-out
      ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      w-[240px] px-15
      md:static md:z-auto md:shrink-0 md:translate-x-0 md:shadow-none
      ${collapsed ? 'md:w-64 md:px-10' : 'md:w-[240px] md:px-15'}`}
      >
        <p className="font-bold text-[32px] tracking-[-1%] text-text text-center justify-center transition-colors duration-200 ease-out">
          {collapsed ? 'T' : 'Tradevise'}
        </p>

        <nav className="flex flex-col gap-8 flex-1 pt-8.75">
          {NAV_ITEMS.map((item) => (
            <NavItem
              key={item.to}
              {...item}
              collapsed={collapsed}
              disabled={false}
              onNavigate={onNavigate}
            />
          ))}
        </nav>

        <div className={collapsed ? 'flex justify-center' : ''}>
          <button
            type="button"
            title={collapsed ? 'Portfolios' : undefined}
            aria-label="Open portfolios"
            onClick={() => setPortfolioModalOpen(true)}
            className={`flex items-center text-left text-body text-text transition-colors hover:text-muted hover:cursor-pointer ${
              collapsed
                ? 'size-10 justify-center rounded-lg hover:bg-surface-hover'
                : 'h-11 w-full gap-4'
            }`}
          >
            <span className="size-6 shrink-0 rounded-full bg-muted" />
            {!collapsed && (
              <span className="min-w-0 flex-1">
                <span className="block truncate text-body font-medium text-text">
                  {user?.username ?? 'Account'}
                </span>
                <span className="block truncate text-small text-muted">
                  {activePortfolio?.name ?? 'Portfolios'}
                </span>
              </span>
            )}
            {!collapsed && (
              <ArrowUpDown size={18} strokeWidth={1.6} className="shrink-0 text-muted" />
            )}
          </button>
        </div>
      </aside>

      {portfolioModalOpen && (
        <PortfolioSwitcherModal
          isOpen={portfolioModalOpen}
          onClose={() => setPortfolioModalOpen(false)}
        />
      )}
    </>
  )
}

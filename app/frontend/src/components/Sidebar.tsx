import { LayoutDashboard, Wallet, Search, Trophy, Users } from 'lucide-react'
import NavItem from './NavItem'

const NAV_ITEMS = [
  { to: '/home', icon: LayoutDashboard, label: 'Home' },
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
  return (
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
    </aside>
  )
}

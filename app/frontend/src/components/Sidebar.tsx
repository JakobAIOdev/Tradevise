import { LayoutDashboard, Wallet, Search, Trophy, Users } from 'lucide-react'
import NavItem from './NavItem'

const NAV_ITEMS = [
  { to: '/home', icon: LayoutDashboard, label: 'Home' },
  { to: '/portfolio', icon: Wallet, label: 'Portfolio' },
  { to: '/discover', icon: Search, label: 'Discover' },
  { to: '/ranking', icon: Trophy, label: 'Ranking', disabled: true },
  { to: '/groups', icon: Users, label: 'Groups', disabled: true },
]

interface SidebarProps {
  collapsed: boolean
}

export default function Sidebar({ collapsed }: SidebarProps) {
  return (
    <aside
      className={`flex flex-col h-screen bg-surface border-r border-border
      transition-[width,padding,background-color,border-color] duration-200 ease-out shrink-0 py-25
      ${collapsed ? 'w-64 px-10' : 'w-[240px] px-15'}`}
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
            disabled={item.disabled ?? false}
          />
        ))}
      </nav>
    </aside>
  )
}

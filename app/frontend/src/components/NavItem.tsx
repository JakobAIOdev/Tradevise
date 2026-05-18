import { NavLink, useLocation } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'

interface NavItemProps {
  to: string
  icon: LucideIcon
  label: string
  collapsed: boolean
  disabled: boolean
  onNavigate: () => void
}

export default function NavItem({
  to,
  icon: Icon,
  label,
  collapsed,
  disabled,
  onNavigate,
}: NavItemProps) {
  const location = useLocation()

  return (
    <NavLink
      to={disabled ? (location?.pathname ?? '/') : to}
      title={collapsed ? label : undefined}
      onClick={() => {
        if (!disabled) {
          onNavigate()
        }
      }}
      className={({ isActive }) =>
        `relative group flex items-center transition-[background-color,color,padding,gap] duration-200 ease-out rounded-lg text-small font-medium
        ${collapsed ? 'justify-center p-10' : 'gap-3 px-15 py-10'}
        ${isActive ? 'bg-surface-hover text-text' : 'text-muted hover:bg-surface-hover hover:text-text'}
        ${disabled ? 'opacity-50 cursor-not-allowed bg-transparent!' : ''}`
      }
    >
      <Icon size={20} strokeWidth={1.5} className="shrink-0" />

      <span
        className={`whitespace-nowrap transition-all duration-200 overflow-hidden
          ${collapsed ? 'w-0 opacity-0 translate-x-1' : 'w-auto opacity-100 translate-x-0'}`}
      >
        {label}
      </span>

      {collapsed && (
        <span
          className="absolute left-full ml-10 px-10 py-8 bg-surface border border-border
          rounded-lg text-text text-small whitespace-nowrap opacity-0 group-hover:opacity-100
          pointer-events-none transition-[opacity,background-color,border-color,color] duration-150 ease-out"
        >
          {label}
        </span>
      )}
    </NavLink>
  )
}

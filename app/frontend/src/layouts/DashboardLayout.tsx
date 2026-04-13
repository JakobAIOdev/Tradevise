import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import { useState } from 'react'

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      <Sidebar collapsed={collapsed} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar onToggle={() => setCollapsed(!collapsed)} />
        <main className="flex-1 overflow-y-auto p-25 md:p-40">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

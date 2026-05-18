import { Outlet, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import { useEffect, useState } from 'react'
import { useAuthStore } from '../stores/authStore'

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
    }
  }, [isAuthenticated, navigate])

  if (!isAuthenticated) return <></>

  return (
    <div className="flex h-screen bg-bg overflow-hidden transition-colors duration-200 ease-out">
      {mobileSidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileSidebarOpen}
        onNavigate={() => setMobileSidebarOpen(false)}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar
          onToggle={() => {
            if (window.innerWidth < 768) {
              setMobileSidebarOpen((open) => !open)
              return
            }

            setCollapsed((value) => !value)
          }}
        />
        <main className="flex-1 overflow-y-auto pl-12.5 pt-40 md:p-40 transition-colors duration-200 ease-out mr-80">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

import { BrowserRouter, Route, Routes } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import HomePage from './pages/HomePage'
import PortfolioPage from './pages/PortfolioPage'
import DiscoverPage from './pages/DiscoverPage'
import StockDetailPage from './pages/StockDetailPage'
import RankedPage from './pages/RankedPage'
import GroupPage from './pages/GroupPage'
import AuthPage from './pages/AuthPage'
import PublicLayout from './layouts/PublicLayout'
import DashboardLayout from './layouts/DashboardLayout'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthError } from './lib/api'
import { useAuthBootstrap } from './hooks/useAuthBootstrap'
import ModalRoot from './components/modal/ModalRoot'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error instanceof AuthError) return false
        return failureCount < 3
      },
    },
  },
})

function App() {
  const isAuthInitialized = useAuthBootstrap()

  return (
    <QueryClientProvider client={queryClient}>
      {isAuthInitialized && (
        <>
          <BrowserRouter>
            <Routes>
              <Route element={<PublicLayout />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<AuthPage />} />
              </Route>

              <Route element={<DashboardLayout />}>
                <Route path="/home" element={<HomePage />} />
                <Route path="/portfolio" element={<PortfolioPage />} />
                <Route path="/discover" element={<DiscoverPage />} />
                <Route path="/detail/:ticker" element={<StockDetailPage />} />
                <Route path="/ranking" element={<RankedPage />} />
                <Route path="/groups" element={<GroupPage />} />
                <Route path="/groups/:groupId" element={<GroupPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
          <ModalRoot />
        </>
      )}
    </QueryClientProvider>
  )
}

export default App

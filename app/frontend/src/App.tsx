import { BrowserRouter, Route, Routes } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import PortfolioPage from './pages/PortfolioPage'
import DiscoverPage from './pages/DiscoverPage'
import StockDetailPage from './pages/StockDetailPage'
import RankedPage from './pages/RankedPage'
import GroupPage from './pages/GroupPage'
import PublicLayout from './layouts/PublicLayout'
import DashboardLayout from './layouts/DashboardLayout'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthError } from './lib/api'

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
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
          </Route>

          <Route element={<DashboardLayout />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="/discover" element={<DiscoverPage />} />
            <Route path="/detail/:ticker" element={<StockDetailPage />} />
            <Route path="/ranking" element={<RankedPage />} />
            <Route path="/groups" element={<GroupPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App

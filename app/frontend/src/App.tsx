import { BrowserRouter, Route, Routes } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import PortfolioPage from './pages/PortfolioPage'
import DiscoverPage from './pages/DiscoverPage'
import StockDetailPage from './pages/StockDetailPage'
import RankedPage from './pages/RankedPage'
import GroupPage from './pages/GroupPage'
import PublicLayout from './layouts/PublicLayout'
import DashboardLayout from './layouts/DashboardLayout'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Route>

        <Route element={<DashboardLayout />}>
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/search" element={<DiscoverPage />} />
          <Route path="/stock/:ticker" element={<StockDetailPage />} />
          <Route path="/ranked" element={<RankedPage />} />
          <Route path="/groups" element={<GroupPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App

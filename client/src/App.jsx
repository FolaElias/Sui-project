import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import SplashScreen from './components/shared/SplashScreen'

// Pages
import LandingPage from './pages/LandingPage'
import CreateWalletPage from './pages/CreateWalletPage'
import ImportWalletPage from './pages/ImportWalletPage'
import UnlockPage from './pages/UnlockPage'
import DashboardPage from './pages/DashboardPage'
import SendPage from './pages/SendPage'
import ReceivePage from './pages/ReceivePage'
import NFTsPage from './pages/NFTsPage'
import MarketplacePage from './pages/MarketplacePage'
import P2PPage from './pages/P2PPage'
import HistoryPage from './pages/HistoryPage'
import SettingsPage from './pages/SettingsPage'

function ProtectedRoute({ children }) {
  const { isUnlocked } = useAuth()
  return isUnlocked ? children : <Navigate to="/" replace />
}

export default function App() {
  const [splash, setSplash] = useState(true)

  const handleSplashDone = () => setSplash(false)

  if (splash) return <SplashScreen onDone={handleSplashDone} />

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/create" element={<CreateWalletPage />} />
      <Route path="/import" element={<ImportWalletPage />} />
      <Route path="/unlock" element={<UnlockPage />} />

      {/* Protected — wallet must be unlocked */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/send" element={<ProtectedRoute><SendPage /></ProtectedRoute>} />
      <Route path="/receive" element={<ProtectedRoute><ReceivePage /></ProtectedRoute>} />
      <Route path="/nfts" element={<ProtectedRoute><NFTsPage /></ProtectedRoute>} />
      <Route path="/marketplace" element={<ProtectedRoute><MarketplacePage /></ProtectedRoute>} />
      <Route path="/p2p" element={<ProtectedRoute><P2PPage /></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
    </Routes>
  )
}

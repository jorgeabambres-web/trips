import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/LoginPage'
import TripsPage from './pages/TripsPage'
import TripOverviewPage from './pages/TripOverviewPage'
import RoteiroPage from './pages/RoteiroPage'
import FinanceiroPage from './pages/FinanceiroPage'
import HojePage from './pages/HojePage'
import VoosPage from './pages/VoosPage'
import Spinner from './components/ui/Spinner'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-dvh bg-bg flex items-center justify-center"><Spinner size="lg" /></div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<TripsPage />} />
            <Route path="trip/:tripId" element={<TripOverviewPage />} />
            <Route path="trip/:tripId/hoje" element={<HojePage />} />
            <Route path="trip/:tripId/roteiro" element={<RoteiroPage />} />
            <Route path="trip/:tripId/financeiro" element={<FinanceiroPage />} />
            <Route path="trip/:tripId/voos" element={<VoosPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

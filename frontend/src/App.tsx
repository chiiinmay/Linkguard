import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import HomePage from '@/pages/HomePage'
import DashboardPage from '@/pages/DashboardPage'
import ScanPage from '@/pages/ScanPage'
import HistoryPage from '@/pages/HistoryPage'
import { useAuthStore } from '@/lib/store'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  return user ? <>{children}</> : <Navigate to="/" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="scan" element={<ScanPage />} />
        <Route path="dashboard" element={
          <ProtectedRoute><DashboardPage /></ProtectedRoute>
        } />
        <Route path="history" element={
          <ProtectedRoute><HistoryPage /></ProtectedRoute>
        } />
      </Route>
    </Routes>
  )
}

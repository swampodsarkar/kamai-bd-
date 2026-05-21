import { Routes, Route, Navigate } from 'react-router-dom'
import { useUser } from './context/UserContext'
import Dashboard from './components/Dashboard'
import WatchAd from './components/WatchAd'
import Referral from './components/Referral'
import Withdraw from './components/Withdraw'
import DailyBonus from './components/DailyBonus'
import AdminPanel from './components/admin/AdminPanel'
import AdminLogin from './components/admin/AdminLogin'
import Loading from './components/Loading'
import Navbar from './components/Navbar'

function ProtectedRoute({ children }) {
  const { user, loading } = useUser()
  if (loading) return <Loading />
  if (!user) return <Navigate to="/" replace />
  return children
}

function AdminRoute({ children }) {
  const { user, userData, loading } = useUser()
  if (loading) return <Loading />
  if (!user) return <Navigate to="/admin/login" replace />
  if (!userData?.isAdmin) return <Navigate to="/" replace />
  return children
}

export default function App() {
  const { user, userData, loading } = useUser()

  if (loading) {
    return <Loading />
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="*" element={<Unauthenticated />} />
      </Routes>
    )
  }

  return (
    <div className="min-h-screen bg-dark-950 pb-24">
      <Navbar />
      <main className="px-4 pt-4 max-w-lg mx-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/watch" element={<WatchAd />} />
          <Route path="/referral" element={<Referral />} />
          <Route path="/withdraw" element={<Withdraw />} />
          <Route path="/bonus" element={<DailyBonus />} />
          <Route
            path="/admin/*"
            element={
              <AdminRoute>
                <AdminPanel />
              </AdminRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

function Unauthenticated() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-dark-950">
      <div className="w-20 h-20 rounded-full gold-gradient flex items-center justify-center mb-6 coin-float">
        <span className="text-3xl font-bold text-dark-950">K</span>
      </div>
      <h1 className="text-3xl font-bold gold-gradient-text mb-2">Kamai BD</h1>
      <p className="text-gray-400 text-center mb-8">Open this app from Telegram to start earning</p>
      <div className="glass-card rounded-2xl p-6 w-full max-w-xs text-center">
        <p className="text-sm text-gray-400">Please open in Telegram</p>
        <p className="text-xs text-gray-500 mt-2">@KamaiBDBot</p>
      </div>
    </div>
  )
}

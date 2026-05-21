import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { db, ref, onValue, off } from '../../lib/firebase'
import UserList from './UserList'
import WithdrawalRequests from './WithdrawalRequests'
import AdLogs from './AdLogs'
import { useUser } from '../../context/UserContext'

const tabs = [
  { path: '/admin', label: 'Dashboard', icon: '📊' },
  { path: '/admin/users', label: 'Users', icon: '👥' },
  { path: '/admin/withdrawals', label: 'Withdrawals', icon: '💳' },
  { path: '/admin/logs', label: 'Ad Logs', icon: '📋' },
]

export default function AdminPanel() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useUser()
  const [users, setUsers] = useState({})
  const [withdrawals, setWithdrawals] = useState({})

  useEffect(() => {
    if (!user?.uid) return

    const usersRef = ref(db, 'users')
    const unsubUsers = onValue(usersRef, (snap) => {
      if (snap.exists()) setUsers(snap.val())
    })

    const withdrawalsRef = ref(db, 'withdrawals')
    const unsubWithdrawals = onValue(withdrawalsRef, (snap) => {
      if (snap.exists()) setWithdrawals(snap.val())
    })

    return () => {
      off(usersRef)
      off(withdrawalsRef)
    }
  }, [user?.uid])

  const totalUsers = Object.keys(users).length
  const pendingWithdrawals = Object.values(withdrawals).filter((w) => w.status === 'pending').length
  const totalBalance = Object.values(users).reduce((sum, u) => sum + (u.balance || 0), 0)
  const totalAdsWatched = Object.values(users).reduce((sum, u) => sum + (u.adsWatched || 0), 0)

  return (
    <div className="space-y-4 animate-fade-in pb-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gold-gradient-text">Admin Panel</h1>
          <p className="text-gray-400 text-sm">Manage your earning platform</p>
        </div>
        <div className="px-3 py-1 rounded-full bg-gold-500/10 text-gold-400 text-xs font-medium">
          Admin
        </div>
      </div>

      <div className="flex overflow-x-auto gap-2 scrollbar-hide pb-1">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl whitespace-nowrap text-sm transition-all ${
                isActive
                  ? 'gold-gradient text-dark-950 font-semibold'
                  : 'glass-card text-gray-400 hover:text-white'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      <Routes>
        <Route
          index
          element={
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="glass-card rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-white">{totalUsers || 0}</p>
                  <p className="text-gray-400 text-xs mt-1">Total Users</p>
                </div>
                <div className="glass-card rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-amber-400">{pendingWithdrawals}</p>
                  <p className="text-gray-400 text-xs mt-1">Pending Withdrawals</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="glass-card rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-400">{totalBalance.toFixed(2)}</p>
                  <p className="text-gray-400 text-xs mt-1">Total Balance (Tk)</p>
                </div>
                <div className="glass-card rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-blue-400">{totalAdsWatched}</p>
                  <p className="text-gray-400 text-xs mt-1">Total Ads Watched</p>
                </div>
              </div>
            </div>
          }
        />
        <Route path="users" element={<UserList />} />
        <Route path="withdrawals" element={<WithdrawalRequests />} />
        <Route path="logs" element={<AdLogs />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </div>
  )
}
